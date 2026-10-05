-- ==============================================================================
-- Migration: 20260928000004_retention_and_purge_lifecycle.sql
-- Amapati: Content Retention & Removal Lifecycle + Location Discovery Support
-- ==============================================================================

-- 1. LOCATION EXTENSIONS ON PROFILES & POSTS
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS latitude NUMERIC,
ADD COLUMN IF NOT EXISTS longitude NUMERIC;

ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS latitude NUMERIC,
ADD COLUMN IF NOT EXISTS longitude NUMERIC;

-- 2. LIFECYCLE COLUMNS ON POSTS AND COMMENTS
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deletion_reason TEXT CHECK (deletion_reason IN ('user_deleted', 'moderator_removed', 'admin_purged')),
ADD COLUMN IF NOT EXISTS purge_eligible_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS purged_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE public.comments
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deletion_reason TEXT CHECK (deletion_reason IN ('user_deleted', 'moderator_removed', 'admin_purged')),
ADD COLUMN IF NOT EXISTS purge_eligible_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS purged_at TIMESTAMPTZ DEFAULT NULL;

-- Indexes for performance on lifecycle queries
CREATE INDEX IF NOT EXISTS idx_posts_deleted_at ON public.posts(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_purge_eligible ON public.posts(purge_eligible_at) WHERE purge_eligible_at IS NOT NULL AND purged_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_comments_purge_eligible ON public.comments(purge_eligible_at) WHERE purge_eligible_at IS NOT NULL AND purged_at IS NULL;

-- 3. RETENTION POLICY TABLE
CREATE TABLE IF NOT EXISTS public.retention_policy (
    content_type TEXT NOT NULL CHECK (content_type IN ('post', 'comment')),
    deletion_reason TEXT NOT NULL CHECK (deletion_reason IN ('user_deleted', 'moderator_removed')),
    retention_days INT NOT NULL DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (content_type, deletion_reason)
);

ALTER TABLE public.retention_policy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view retention policy"
    ON public.retention_policy FOR SELECT
    USING (true);

CREATE POLICY "Only staff can update retention policy"
    ON public.retention_policy FOR ALL
    USING (public.is_moderator(auth.uid()));

-- Seed configurable retention policy
INSERT INTO public.retention_policy (content_type, deletion_reason, retention_days)
VALUES
    ('post', 'user_deleted', 30),
    ('post', 'moderator_removed', 14),
    ('comment', 'user_deleted', 30),
    ('comment', 'moderator_removed', 14)
ON CONFLICT (content_type, deletion_reason) DO UPDATE
SET retention_days = EXCLUDED.retention_days;

-- 4. SOFT DELETE RPC FUNCTION
CREATE OR REPLACE FUNCTION public.soft_delete_content(
    p_content_type TEXT,
    p_content_id UUID,
    p_reason TEXT,
    p_report_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_caller_id UUID := auth.uid();
    v_retention_days INT := 30;
    v_purge_at TIMESTAMPTZ;
    v_old_data JSONB;
    v_new_data JSONB;
    v_author_id UUID;
BEGIN
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    IF p_reason NOT IN ('user_deleted', 'moderator_removed', 'admin_purged') THEN
        RAISE EXCEPTION 'Invalid deletion reason: %', p_reason;
    END IF;

    -- Lookup retention period
    SELECT retention_days INTO v_retention_days
    FROM public.retention_policy
    WHERE content_type = p_content_type
      AND deletion_reason = p_reason;

    IF v_retention_days IS NULL THEN
        v_retention_days := CASE WHEN p_reason = 'moderator_removed' THEN 14 ELSE 30 END;
    END IF;

    v_purge_at := NOW() + (v_retention_days * INTERVAL '1 day');

    IF p_content_type = 'post' THEN
        SELECT user_id, to_jsonb(p.*) INTO v_author_id, v_old_data
        FROM public.posts p
        WHERE p.id = p_content_id;

        IF v_old_data IS NULL THEN
            RAISE EXCEPTION 'Post not found.';
        END IF;

        IF p_reason = 'user_deleted' AND v_author_id != v_caller_id THEN
            RAISE EXCEPTION 'Only the post author can soft delete their own post.';
        END IF;

        IF p_reason = 'moderator_removed' AND NOT public.is_moderator(v_caller_id) THEN
            RAISE EXCEPTION 'Only moderators or admins can perform moderator removals.';
        END IF;

        -- Update post with soft-delete metadata
        UPDATE public.posts
        SET is_deleted = TRUE,
            deleted_at = NOW(),
            deleted_by = v_caller_id,
            deletion_reason = p_reason,
            purge_eligible_at = v_purge_at,
            trending_score = 0.0
        WHERE id = p_content_id
        RETURNING to_jsonb(posts.*) INTO v_new_data;

        -- If tied to a report, mark report resolved
        IF p_report_id IS NOT NULL THEN
            UPDATE public.reports
            SET status = 'resolved',
                reviewed_by = v_caller_id,
                resolved_at = NOW()
            WHERE id = p_report_id;
        END IF;

    ELSIF p_content_type = 'comment' THEN
        SELECT user_id, to_jsonb(c.*) INTO v_author_id, v_old_data
        FROM public.comments c
        WHERE c.id = p_content_id;

        IF v_old_data IS NULL THEN
            RAISE EXCEPTION 'Comment not found.';
        END IF;

        IF p_reason = 'user_deleted' AND v_author_id != v_caller_id THEN
            RAISE EXCEPTION 'Only the comment author can soft delete their comment.';
        END IF;

        IF p_reason = 'moderator_removed' AND NOT public.is_moderator(v_caller_id) THEN
            RAISE EXCEPTION 'Only moderators or admins can perform moderator removals.';
        END IF;

        -- Update comment with soft-delete metadata
        UPDATE public.comments
        SET deleted_at = NOW(),
            deleted_by = v_caller_id,
            deletion_reason = p_reason,
            purge_eligible_at = v_purge_at
        WHERE id = p_content_id
        RETURNING to_jsonb(comments.*) INTO v_new_data;

    ELSE
        RAISE EXCEPTION 'Invalid content_type: %', p_content_type;
    END IF;

    -- Append audit trace to activity_log (full old_data + new_data)
    INSERT INTO public.activity_log (
        user_id, action, entity_type, entity_id, old_data, new_data, created_at
    ) VALUES (
        v_caller_id,
        p_content_type || '_soft_deleted',
        p_content_type || 's',
        p_content_id,
        v_old_data,
        v_new_data,
        NOW()
    );

    RETURN jsonb_build_object(
        'success', true,
        'content_type', p_content_type,
        'content_id', p_content_id,
        'deleted_at', NOW(),
        'purge_eligible_at', v_purge_at,
        'retention_days', v_retention_days
    );
END;
$$;

-- 5. RESTORE CONTENT RPC FUNCTION (Recovery)
CREATE OR REPLACE FUNCTION public.restore_content(
    p_content_type TEXT,
    p_content_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_caller_id UUID := auth.uid();
    v_old_data JSONB;
    v_new_data JSONB;
    v_author_id UUID;
    v_reason TEXT;
    v_purge_at TIMESTAMPTZ;
    v_purged_at TIMESTAMPTZ;
BEGIN
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    IF p_content_type = 'post' THEN
        SELECT user_id, deletion_reason, purge_eligible_at, purged_at, to_jsonb(p.*)
        INTO v_author_id, v_reason, v_purge_at, v_purged_at, v_old_data
        FROM public.posts p
        WHERE p.id = p_content_id;

        IF v_old_data IS NULL THEN
            RAISE EXCEPTION 'Post not found.';
        END IF;

        IF v_purged_at IS NOT NULL THEN
            RAISE EXCEPTION 'This post has already been permanently purged and cannot be restored.';
        END IF;

        IF v_reason != 'user_deleted' THEN
            RAISE EXCEPTION 'Only user-deleted content can be restored by the user. Moderator-removed content cannot be un-removed.';
        END IF;

        IF v_author_id != v_caller_id THEN
            RAISE EXCEPTION 'Only the original author can restore this content.';
        END IF;

        IF v_purge_at IS NOT NULL AND v_purge_at <= NOW() THEN
            RAISE EXCEPTION 'The retention window for this post has expired.';
        END IF;

        UPDATE public.posts
        SET is_deleted = FALSE,
            deleted_at = NULL,
            deleted_by = NULL,
            deletion_reason = NULL,
            purge_eligible_at = NULL
        WHERE id = p_content_id
        RETURNING to_jsonb(posts.*) INTO v_new_data;

    ELSIF p_content_type = 'comment' THEN
        SELECT user_id, deletion_reason, purge_eligible_at, purged_at, to_jsonb(c.*)
        INTO v_author_id, v_reason, v_purge_at, v_purged_at, v_old_data
        FROM public.comments c
        WHERE c.id = p_content_id;

        IF v_old_data IS NULL THEN
            RAISE EXCEPTION 'Comment not found.';
        END IF;

        IF v_purged_at IS NOT NULL THEN
            RAISE EXCEPTION 'This comment has already been permanently purged.';
        END IF;

        IF v_reason != 'user_deleted' THEN
            RAISE EXCEPTION 'Only user-deleted content can be restored.';
        END IF;

        IF v_author_id != v_caller_id THEN
            RAISE EXCEPTION 'Only the original author can restore this comment.';
        END IF;

        IF v_purge_at IS NOT NULL AND v_purge_at <= NOW() THEN
            RAISE EXCEPTION 'The retention window for this comment has expired.';
        END IF;

        UPDATE public.comments
        SET deleted_at = NULL,
            deleted_by = NULL,
            deletion_reason = NULL,
            purge_eligible_at = NULL
        WHERE id = p_content_id
        RETURNING to_jsonb(comments.*) INTO v_new_data;

    ELSE
        RAISE EXCEPTION 'Invalid content_type: %', p_content_type;
    END IF;

    -- Append audit trace
    INSERT INTO public.activity_log (
        user_id, action, entity_type, entity_id, old_data, new_data, created_at
    ) VALUES (
        v_caller_id,
        p_content_type || '_restored',
        p_content_type || 's',
        p_content_id,
        v_old_data,
        v_new_data,
        NOW()
    );

    RETURN jsonb_build_object(
        'success', true,
        'content_type', p_content_type,
        'content_id', p_content_id,
        'restored_at', NOW()
    );
END;
$$;

-- 6. PERMANENT PURGE FUNCTION (Worker & Admin On-Demand)
-- Only metadata trace remains in activity_log (NO content body or media)
CREATE OR REPLACE FUNCTION public.purge_expired_content()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_purged_posts INT := 0;
    v_purged_comments INT := 0;
    v_rec RECORD;
BEGIN
    -- 1. Purge expired posts
    FOR v_rec IN (
        SELECT id, user_id, deleted_at, deletion_reason, purge_eligible_at
        FROM public.posts
        WHERE deleted_at IS NOT NULL
          AND purge_eligible_at <= NOW()
          AND purged_at IS NULL
    ) LOOP
        -- Wipe content body and media reference
        UPDATE public.posts
        SET caption = '[Purged after retention window]',
            media_url = '',
            thumbnail_url = NULL,
            purged_at = NOW()
        WHERE id = v_rec.id;

        -- Record METADATA ONLY trace in activity_log (never content text or media)
        INSERT INTO public.activity_log (
            user_id, action, entity_type, entity_id, old_data, new_data, created_at
        ) VALUES (
            v_rec.user_id,
            'content_purged',
            'posts',
            v_rec.id,
            NULL,
            jsonb_build_object(
                'purged_content_id', v_rec.id,
                'content_type', 'post',
                'deleted_at', v_rec.deleted_at,
                'deletion_reason', v_rec.deletion_reason,
                'purge_eligible_at', v_rec.purge_eligible_at,
                'purged_at', NOW()
            ),
            NOW()
        );

        v_purged_posts := v_purged_posts + 1;
    END LOOP;

    -- 2. Purge expired comments
    FOR v_rec IN (
        SELECT id, user_id, deleted_at, deletion_reason, purge_eligible_at
        FROM public.comments
        WHERE deleted_at IS NOT NULL
          AND purge_eligible_at <= NOW()
          AND purged_at IS NULL
    ) LOOP
        UPDATE public.comments
        SET body = '[Purged after retention window]',
            purged_at = NOW()
        WHERE id = v_rec.id;

        -- Record METADATA ONLY trace
        INSERT INTO public.activity_log (
            user_id, action, entity_type, entity_id, old_data, new_data, created_at
        ) VALUES (
            v_rec.user_id,
            'content_purged',
            'comments',
            v_rec.id,
            NULL,
            jsonb_build_object(
                'purged_content_id', v_rec.id,
                'content_type', 'comment',
                'deleted_at', v_rec.deleted_at,
                'deletion_reason', v_rec.deletion_reason,
                'purge_eligible_at', v_rec.purge_eligible_at,
                'purged_at', NOW()
            ),
            NOW()
        );

        v_purged_comments := v_purged_comments + 1;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'purged_posts_count', v_purged_posts,
        'purged_comments_count', v_purged_comments,
        'timestamp', NOW()
    );
END;
$$;
