-- ==============================================================================
-- Migration: 20260928000002_comments_v2_system.sql
-- Amapati: Full Nested Comments System, Likes, Mentions, Rate Limiting & RPCs
-- ==============================================================================

-- 1. DROP OR MIGRATE COMMENTS TABLE TO FULL SPEC
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    body TEXT NOT NULL CHECK (char_length(trim(body)) > 0 AND char_length(body) <= 500),
    is_pinned BOOLEAN DEFAULT FALSE NOT NULL,
    is_edited BOOLEAN DEFAULT FALSE NOT NULL,
    edited_at TIMESTAMPTZ DEFAULT NULL,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Ensure columns exist if table was previously created
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS body TEXT;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Backfill body from content if content column existed
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'comments' AND column_name = 'content'
    ) THEN
        UPDATE public.comments SET body = content WHERE body IS NULL AND content IS NOT NULL;
    END IF;
END $$;

-- 2. COMMENT LIKES TABLE
CREATE TABLE IF NOT EXISTS public.comment_likes (
    comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    PRIMARY KEY (comment_id, user_id)
);

-- 3. COMMENT MENTIONS TABLE
CREATE TABLE IF NOT EXISTS public.comment_mentions (
    comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
    mentioned_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    PRIMARY KEY (comment_id, mentioned_user_id)
);

-- 4. IN-APP NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('comment', 'reply', 'mention', 'like', 'follow')),
    target_id UUID NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Update reports target_type check to include 'comment'
ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_target_type_check;
ALTER TABLE public.reports ADD CONSTRAINT reports_target_type_check CHECK (target_type IN ('post', 'profile', 'comment'));

-- 5. INDEXES FOR RAPID COMMENT RETRIEVAL
CREATE INDEX IF NOT EXISTS idx_comments_post_created ON public.comments(post_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON public.comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_pinned ON public.comments(post_id, is_pinned) WHERE is_pinned = TRUE;
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON public.comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_mentions_user ON public.comment_mentions(mentioned_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read, created_at DESC);

-- 6. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Comments Select Policy: Non-blocked users can read comments on non-deleted posts
CREATE POLICY comments_select_v2 ON public.comments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.posts p
            WHERE p.id = comments.post_id AND p.is_deleted = FALSE
        )
        AND NOT EXISTS (
            SELECT 1 FROM public.blocks b
            WHERE (b.blocker_id = auth.uid() AND b.blocked_id = comments.user_id)
               OR (b.blocker_id = comments.user_id AND b.blocked_id = auth.uid())
        )
    );

-- Comments Insert Policy: Rate limit max 10 comments per minute, prevent nested replies deeper than 1 level
CREATE OR REPLACE FUNCTION public.check_comment_rate_limit(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_recent_count INT;
BEGIN
    SELECT COUNT(*) INTO v_recent_count
    FROM public.comments
    WHERE user_id = p_user_id
      AND created_at >= NOW() - INTERVAL '1 minute';

    RETURN v_recent_count < 10;
END;
$$;

CREATE POLICY comments_insert_v2 ON public.comments
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id
        AND public.check_comment_rate_limit(user_id)
        -- Ensure parent comment is top-level (no replies to replies)
        AND (
            parent_comment_id IS NULL OR
            EXISTS (
                SELECT 1 FROM public.comments p
                WHERE p.id = parent_comment_id AND p.parent_comment_id IS NULL
            )
        )
    );

-- Comment Likes Policies
CREATE POLICY comment_likes_select ON public.comment_likes FOR SELECT USING (TRUE);
CREATE POLICY comment_likes_insert ON public.comment_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY comment_likes_delete ON public.comment_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Notifications Policy
CREATE POLICY notifications_select ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY notifications_update ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- 7. SECURE RPC FUNCTIONS (Moderation, Editing, Pinning)

-- RPC: Soft-delete comment (Allowed by comment author OR post owner)
CREATE OR REPLACE FUNCTION public.rpc_delete_comment(p_comment_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_comment RECORD;
    v_post RECORD;
    v_actor UUID := auth.uid();
BEGIN
    SELECT * INTO v_comment FROM public.comments WHERE id = p_comment_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Comment not found';
    END IF;

    SELECT * INTO v_post FROM public.posts WHERE id = v_comment.post_id;

    -- Verify permission: must be comment author or post owner
    IF v_actor <> v_comment.user_id AND v_actor <> v_post.user_id THEN
        RAISE EXCEPTION 'Not authorized to delete this comment';
    END IF;

    -- Soft delete
    UPDATE public.comments
    SET deleted_at = NOW()
    WHERE id = p_comment_id;

    -- Log to activity_log
    INSERT INTO public.activity_log(user_id, action, entity_type, entity_id, old_data, new_data)
    VALUES (
        v_actor,
        CASE WHEN v_actor = v_post.user_id AND v_actor <> v_comment.user_id THEN 'comment_moderated' ELSE 'comment_deleted' END,
        'comments',
        p_comment_id::text,
        row_to_json(v_comment)::jsonb,
        jsonb_build_object('deleted_at', NOW(), 'deleted_by', v_actor)
    );

    RETURN jsonb_build_object('success', true, 'comment_id', p_comment_id);
END;
$$;

-- RPC: Edit comment within 5 minutes of posting
CREATE OR REPLACE FUNCTION public.rpc_edit_comment(p_comment_id UUID, p_new_body TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_comment RECORD;
    v_actor UUID := auth.uid();
BEGIN
    SELECT * INTO v_comment FROM public.comments WHERE id = p_comment_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Comment not found';
    END IF;

    IF v_actor <> v_comment.user_id THEN
        RAISE EXCEPTION 'You can only edit your own comment';
    END IF;

    -- Check 5 minute window
    IF v_comment.created_at < NOW() - INTERVAL '5 minutes' THEN
        RAISE EXCEPTION 'Comments can only be edited within 5 minutes of posting';
    END IF;

    IF char_length(trim(p_new_body)) = 0 OR char_length(p_new_body) > 500 THEN
        RAISE EXCEPTION 'Comment body must be between 1 and 500 characters';
    END IF;

    UPDATE public.comments
    SET body = p_new_body,
        is_edited = TRUE,
        edited_at = NOW()
    WHERE id = p_comment_id;

    INSERT INTO public.activity_log(user_id, action, entity_type, entity_id, old_data, new_data)
    VALUES (
        v_actor,
        'comment_edited',
        'comments',
        p_comment_id::text,
        jsonb_build_object('body', v_comment.body),
        jsonb_build_object('body', p_new_body, 'edited_at', NOW())
    );

    RETURN jsonb_build_object('success', true, 'comment_id', p_comment_id, 'is_edited', true);
END;
$$;

-- RPC: Pin / Unpin comment (Post owner only, exactly one pinned comment per post)
CREATE OR REPLACE FUNCTION public.rpc_pin_comment(p_post_id UUID, p_comment_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_post RECORD;
    v_comment RECORD;
    v_actor UUID := auth.uid();
    v_currently_pinned BOOLEAN;
BEGIN
    SELECT * INTO v_post FROM public.posts WHERE id = p_post_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Post not found';
    END IF;

    IF v_actor <> v_post.user_id THEN
        RAISE EXCEPTION 'Only the post owner can pin comments';
    END IF;

    SELECT * INTO v_comment FROM public.comments WHERE id = p_comment_id AND post_id = p_post_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Comment does not belong to this post';
    END IF;

    v_currently_pinned := v_comment.is_pinned;

    -- Unpin all comments on this post first (exactly one pinned comment allowed)
    UPDATE public.comments
    SET is_pinned = FALSE
    WHERE post_id = p_post_id;

    -- If it wasn't pinned, pin it now (toggle behavior)
    IF NOT v_currently_pinned THEN
        UPDATE public.comments
        SET is_pinned = TRUE
        WHERE id = p_comment_id;
    END IF;

    INSERT INTO public.activity_log(user_id, action, entity_type, entity_id, old_data, new_data)
    VALUES (
        v_actor,
        CASE WHEN v_currently_pinned THEN 'comment_unpinned' ELSE 'comment_pinned' END,
        'comments',
        p_comment_id::text,
        jsonb_build_object('is_pinned', v_currently_pinned),
        jsonb_build_object('is_pinned', NOT v_currently_pinned)
    );

    RETURN jsonb_build_object('success', true, 'is_pinned', NOT v_currently_pinned);
END;
$$;

-- 8. TRIGGERS FOR COMMENT AUDIT TRAIL
CREATE OR REPLACE FUNCTION public.trg_comment_audit_v2()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.activity_log(user_id, action, entity_type, entity_id, new_data)
        VALUES (NEW.user_id, 'comment_created', 'comments', NEW.id::text, row_to_json(NEW)::jsonb);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_comments_audit_v2 ON public.comments;
CREATE TRIGGER trg_comments_audit_v2
    AFTER INSERT ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.trg_comment_audit_v2();
