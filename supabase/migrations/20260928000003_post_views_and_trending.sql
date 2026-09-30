-- ==============================================================================
-- Migration: 20260928000003_post_views_and_trending.sql
-- Amapati: Post View Tracking, Rolling 24h Deduplication & Discover Trending Ranking
-- ==============================================================================

-- 1. POST VIEWS TABLE
CREATE TABLE IF NOT EXISTS public.post_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    viewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    viewer_fingerprint TEXT DEFAULT NULL, -- For guest/anonymous deduplication
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Indexes on post_views for fast rolling 24h deduplication and analytics
CREATE INDEX IF NOT EXISTS idx_post_views_post_created ON public.post_views(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_views_dedupe_user ON public.post_views(post_id, viewer_id, created_at DESC) WHERE viewer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_post_views_dedupe_anon ON public.post_views(post_id, viewer_fingerprint, created_at DESC) WHERE viewer_fingerprint IS NOT NULL;

-- 2. DENORMALIZED COUNTERS & TRENDING FIELDS ON POSTS
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS view_count INT DEFAULT 0 NOT NULL;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS like_count INT DEFAULT 0 NOT NULL;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS comment_count INT DEFAULT 0 NOT NULL;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS share_count INT DEFAULT 0 NOT NULL;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS save_count INT DEFAULT 0 NOT NULL;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS trending_score NUMERIC DEFAULT 0.0 NOT NULL;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS trending_updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW());

-- Index on posts(trending_score DESC, created_at DESC) for lightning fast Discover queries
CREATE INDEX IF NOT EXISTS idx_posts_trending_discover ON public.posts(trending_score DESC, created_at DESC) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_posts_popular_lifetime ON public.posts(user_id, (like_count + comment_count) DESC) WHERE is_deleted = FALSE;

-- Backfill counts from existing tables if present
DO $$
BEGIN
    -- Backfill like_count
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'likes') THEN
        UPDATE public.posts p
        SET like_count = COALESCE((SELECT COUNT(*) FROM public.likes l WHERE l.post_id = p.id), 0);
    END IF;

    -- Backfill comment_count
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'comments') THEN
        UPDATE public.posts p
        SET comment_count = COALESCE((SELECT COUNT(*) FROM public.comments c WHERE c.post_id = p.id AND c.deleted_at IS NULL), 0);
    END IF;

    -- Backfill view_count
    UPDATE public.posts p
    SET view_count = COALESCE((SELECT COUNT(*) FROM public.post_views pv WHERE pv.post_id = p.id), 0);
END $$;

-- 3. ROW LEVEL SECURITY (RLS) FOR POST VIEWS
ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;

-- Anyone (authenticated or anon) can log views via RPC or SELECT aggregated views
CREATE POLICY post_views_select ON public.post_views
    FOR SELECT
    USING (TRUE);

CREATE POLICY post_views_insert ON public.post_views
    FOR INSERT
    WITH CHECK (
        -- Viewer can be anonymous or matching authenticated user
        (auth.uid() IS NULL OR viewer_id = auth.uid() OR viewer_id IS NULL)
    );

-- 4. TRIGGERS TO AUTOMATICALLY MAINTAIN DENORMALIZED COUNTERS
-- A) View Count Trigger
CREATE OR REPLACE FUNCTION public.trg_post_view_increment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.posts
    SET view_count = view_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_post_view_increment_on_insert ON public.post_views;
CREATE TRIGGER trg_post_view_increment_on_insert
    AFTER INSERT ON public.post_views
    FOR EACH ROW EXECUTE FUNCTION public.trg_post_view_increment();

-- B) Comments Count Trigger
CREATE OR REPLACE FUNCTION public.trg_post_comment_counter()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.posts
        SET comment_count = comment_count + 1
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        -- If soft-deleted
        IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
            UPDATE public.posts
            SET comment_count = GREATEST(0, comment_count - 1)
            WHERE id = NEW.post_id;
        ELSIF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
            UPDATE public.posts
            SET comment_count = comment_count + 1
            WHERE id = NEW.post_id;
        END IF;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        IF OLD.deleted_at IS NULL THEN
            UPDATE public.posts
            SET comment_count = GREATEST(0, comment_count - 1)
            WHERE id = OLD.post_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_post_comment_count_sync ON public.comments;
CREATE TRIGGER trg_post_comment_count_sync
    AFTER INSERT OR UPDATE OR DELETE ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.trg_post_comment_counter();

-- 5. RPC FUNCTION: RECORD VIEW WITH 24-HOUR DEDUPLICATION WINDOW
CREATE OR REPLACE FUNCTION public.record_view(
    p_post_id UUID,
    p_viewer_id UUID DEFAULT NULL,
    p_fingerprint TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_actual_viewer UUID;
    v_existing_id UUID;
BEGIN
    -- Determine actual viewer (use auth.uid() if logged in, or passed param)
    v_actual_viewer := COALESCE(auth.uid(), p_viewer_id);

    -- Check deduplication window: 1 view per post per viewer per rolling 24 hours
    IF v_actual_viewer IS NOT NULL THEN
        SELECT id INTO v_existing_id
        FROM public.post_views
        WHERE post_id = p_post_id
          AND viewer_id = v_actual_viewer
          AND created_at >= NOW() - INTERVAL '24 hours'
        LIMIT 1;
    ELSIF p_fingerprint IS NOT NULL THEN
        SELECT id INTO v_existing_id
        FROM public.post_views
        WHERE post_id = p_post_id
          AND viewer_fingerprint = p_fingerprint
          AND created_at >= NOW() - INTERVAL '24 hours'
        LIMIT 1;
    ELSE
        -- Without identifier, dedupe window fallback
        v_existing_id := NULL;
    END IF;

    -- If already viewed in rolling 24h, return deduped false
    IF v_existing_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', true,
            'recorded', false,
            'deduped', true,
            'post_id', p_post_id
        );
    END IF;

    -- Insert new view (trigger will increment view_count on posts)
    INSERT INTO public.post_views (post_id, viewer_id, viewer_fingerprint, created_at)
    VALUES (p_post_id, v_actual_viewer, p_fingerprint, NOW());

    RETURN jsonb_build_object(
        'success', true,
        'recorded', true,
        'deduped', false,
        'post_id', p_post_id
    );
END;
$$;

-- RPC FUNCTION: BATCH RECORD VIEWS (Client-Side Batched Flushes)
CREATE OR REPLACE FUNCTION public.record_views_batch(
    p_post_ids UUID[],
    p_viewer_id UUID DEFAULT NULL,
    p_fingerprint TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id UUID;
    v_recorded_count INT := 0;
    v_result JSONB;
BEGIN
    FOREACH v_id IN ARRAY p_post_ids LOOP
        v_result := public.record_view(v_id, p_viewer_id, p_fingerprint);
        IF (v_result->>'recorded')::boolean THEN
            v_recorded_count := v_recorded_count + 1;
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'total_sent', array_length(p_post_ids, 1),
        'recorded_count', v_recorded_count
    );
END;
$$;

-- 6. SCHEDULED RANKING CALCULATION (Supabase pg_cron / manual trigger)
-- trending_score =
--   (views_last_24h * 1
--    + likes_last_24h * 3
--    + comments_last_24h * 5
--    + shares_last_24h * 8
--    + saves_last_24h * 4)
--   / power(hours_since_created + 2, 1.5)
--
-- Posts younger than 2 hours receive a flat minimum score ("fresh boost")
-- Posts older than 7 days are set to 0 (excluded from Discover trending)
CREATE OR REPLACE FUNCTION public.recompute_trending_scores()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_updated_count INT := 0;
BEGIN
    -- 1. Reset trending score for posts older than 7 days (or deleted)
    UPDATE public.posts
    SET trending_score = 0.0,
        trending_updated_at = NOW()
    WHERE is_deleted = TRUE
       OR created_at < NOW() - INTERVAL '7 days';

    -- 2. Compute dynamic velocity & decayed score for posts from the last 7 days
    WITH post_velocity AS (
        SELECT
            p.id,
            p.user_id,
            p.created_at,
            EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600.0 AS hours_since_created,
            
            -- Activity in the last 24 hours (velocity)
            COALESCE((
                SELECT COUNT(*)
                FROM public.post_views pv
                WHERE pv.post_id = p.id
                  AND pv.created_at >= NOW() - INTERVAL '24 hours'
            ), 0) AS views_last_24h,

            COALESCE((
                SELECT COUNT(*)
                FROM public.likes l
                WHERE l.post_id = p.id
                  AND l.created_at >= NOW() - INTERVAL '24 hours'
            ), 0) AS likes_last_24h,

            COALESCE((
                SELECT COUNT(*)
                FROM public.comments c
                WHERE c.post_id = p.id
                  AND c.deleted_at IS NULL
                  AND c.created_at >= NOW() - INTERVAL '24 hours'
            ), 0) AS comments_last_24h,

            -- Share count velocity (estimated or tracked in shares table)
            COALESCE(p.share_count, 0) AS shares_last_24h,

            -- Save count velocity (estimated or tracked in saves table)
            COALESCE(p.save_count, 0) AS saves_last_24h
        FROM public.posts p
        WHERE p.is_deleted = FALSE
          AND p.created_at >= NOW() - INTERVAL '7 days'
    ),
    calculated_scores AS (
        SELECT
            id,
            -- Calculate base numerator using activity velocity weights:
            -- views * 1 + likes * 3 + comments * 5 + shares * 8 + saves * 4
            (
                (views_last_24h * 1.0)
                + (likes_last_24h * 3.0)
                + (comments_last_24h * 5.0)
                + (shares_last_24h * 8.0)
                + (saves_last_24h * 4.0)
            ) / POWER(hours_since_created + 2.0, 1.5) AS raw_score,
            hours_since_created
        FROM post_velocity
    )
    UPDATE public.posts p
    SET trending_score = ROUND(
            -- Fresh Boost: Posts younger than 2 hours receive a flat minimum score
            -- of 8.5 so new artisan posts appear in Discover immediately!
            CASE
                WHEN cs.hours_since_created < 2.0 THEN GREATEST(cs.raw_score, 8.5)
                ELSE cs.raw_score
            END,
            4
        ),
        trending_updated_at = NOW()
    FROM calculated_scores cs
    WHERE p.id = cs.id;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;

    RETURN jsonb_build_object(
        'success', true,
        'posts_updated', v_updated_count,
        'timestamp', NOW()
    );
END;
$$;

-- 7. DISCOVER FEED RPC WITH ACCOUNT DIVERSITY RULE
-- "No single account may occupy more than 2 of the top 20 Discover slots in one query"
-- Excludes posts older than 7 days
CREATE OR REPLACE FUNCTION public.get_discover_trending_feed(
    p_limit INT DEFAULT 20,
    p_category TEXT DEFAULT NULL,
    p_viewer_id UUID DEFAULT NULL
)
RETURNS SETOF public.posts
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH candidate_posts AS (
        SELECT
            p.*,
            -- Partition by user_id to count author slots in ranking
            ROW_NUMBER() OVER (
                PARTITION BY p.user_id
                ORDER BY p.trending_score DESC, p.created_at DESC
            ) AS author_slot_rank
        FROM public.posts p
        JOIN public.profiles pr ON pr.id = p.user_id
        WHERE p.is_deleted = FALSE
          AND p.created_at >= NOW() - INTERVAL '7 days'
          AND (p_category IS NULL OR p_category = 'all' OR pr.category ILIKE '%' || p_category || '%')
          -- Exclude blocked users if viewer provided
          AND (
              p_viewer_id IS NULL OR
              NOT EXISTS (
                  SELECT 1 FROM public.blocks b
                  WHERE (b.blocker_id = p_viewer_id AND b.blocked_id = p.user_id)
                     OR (b.blocker_id = p.user_id AND b.blocked_id = p_viewer_id)
              )
          )
    )
    SELECT
        id, user_id, media_type, media_url, thumbnail_url, caption, duration,
        is_deleted, created_at, updated_at, view_count, like_count, comment_count,
        share_count, save_count, trending_score, trending_updated_at
    FROM candidate_posts
    -- Diversity rule: max 2 slots per business in the query
    WHERE author_slot_rank <= 2
    ORDER BY trending_score DESC, created_at DESC
    LIMIT p_limit;
END;
$$;

-- 8. CRON JOB CONFIGURATION (pg_cron)
-- Recomputes trending scores every 10 minutes automatically
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        PERFORM cron.schedule(
            'amapati-recompute-trending',
            '*/10 * * * *',
            'SELECT public.recompute_trending_scores();'
        );
    END IF;
END $$;
