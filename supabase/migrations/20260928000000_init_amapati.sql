-- ==============================================================================
-- Migration: 20260928000000_init_amapati.sql
-- Amapati: Simple Social Media for Small Businesses (TikTok for Small Businesses)
-- Schema, Indexes, Triggers, Activity Log, and Row Level Security (RLS)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PROFILES TABLE
-- Storing business identity, contact, bio, category, and privacy setting
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    bio TEXT DEFAULT '' NOT NULL,
    category TEXT DEFAULT 'General Business' NOT NULL,
    contact TEXT DEFAULT '' NOT NULL,
    avatar_url TEXT DEFAULT '' NOT NULL,
    is_private BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 3. POSTS TABLE
-- Business showcase posts: image (max 5MB), video (max 60s/50MB), audio (max 10m/20MB)
-- Deleting a post is a soft-delete (is_deleted = true) to preserve activity log and integrity
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video', 'audio')),
    media_url TEXT NOT NULL,
    thumbnail_url TEXT DEFAULT '',
    caption TEXT DEFAULT '' NOT NULL,
    duration INTEGER DEFAULT NULL, -- Duration in seconds for video and audio
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 4. FOLLOWS TABLE
-- Follow/unfollow, followers list, follower removal, and optional private account approval
CREATE TABLE IF NOT EXISTS public.follows (
    follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'accepted' CHECK (status IN ('pending', 'accepted')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    PRIMARY KEY (follower_id, following_id)
);

-- 5. BLOCKS TABLE
-- Blocked users cannot see each other's profiles, posts, or feeds
CREATE TABLE IF NOT EXISTS public.blocks (
    blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    PRIMARY KEY (blocker_id, blocked_id)
);

-- 6. REPORTS TABLE
-- Content and business moderation
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL CHECK (target_type IN ('post', 'profile')),
    target_id UUID NOT NULL,
    reason TEXT NOT NULL,
    details TEXT DEFAULT '' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 7. ACTIVITY_LOG TABLE (APPEND-ONLY AUDIT & TRANSACTION TRAIL)
-- Enforced append-only via RLS: strictly no updates or deletes allowed
CREATE TABLE IF NOT EXISTS public.activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    old_data JSONB DEFAULT NULL,
    new_data JSONB DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- ==============================================================================
-- INDEXES FOR HIGH-PERFORMANCE LOW-LATENCY FEEDS & SEARCH
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_category ON public.profiles(category);
CREATE INDEX IF NOT EXISTS idx_profiles_business_name ON public.profiles USING gin (to_tsvector('english', business_name));
CREATE INDEX IF NOT EXISTS idx_posts_active_feed ON public.posts(created_at DESC) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_posts_user ON public.posts(user_id, created_at DESC) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_posts_media_type ON public.posts(media_type) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id, status);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id, status);
CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON public.blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON public.blocks(blocked_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON public.activity_log(user_id, created_at DESC);

-- ==============================================================================
-- AUTOMATIC TIMESTAMPS TRIGGER FUNCTION
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER tr_posts_updated_at
BEFORE UPDATE ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==============================================================================
-- AUTOMATIC ACTIVITY LOG TRIGGER FUNCTIONS (TRANSACTION HISTORY)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.log_activity_event()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_action TEXT;
    v_entity_type TEXT;
    v_entity_id TEXT;
    v_old_data JSONB := NULL;
    v_new_data JSONB := NULL;
BEGIN
    v_entity_type := TG_TABLE_NAME;
    
    -- Determine current acting user ID
    v_user_id := auth.uid();
    
    IF (TG_OP = 'INSERT') THEN
        v_entity_id := (NEW.id)::TEXT;
        v_new_data := to_jsonb(NEW);
        
        IF TG_TABLE_NAME = 'profiles' THEN
            v_action := 'signup';
            v_user_id := NEW.id;
        ELSIF TG_TABLE_NAME = 'posts' THEN
            v_action := 'post_created';
            v_user_id := NEW.user_id;
        ELSIF TG_TABLE_NAME = 'follows' THEN
            v_action := 'followed';
            v_entity_id := NEW.following_id::TEXT;
            v_user_id := NEW.follower_id;
        ELSIF TG_TABLE_NAME = 'blocks' THEN
            v_action := 'blocked';
            v_entity_id := NEW.blocked_id::TEXT;
            v_user_id := NEW.blocker_id;
        ELSIF TG_TABLE_NAME = 'reports' THEN
            v_action := 'reported';
            v_user_id := NEW.reporter_id;
        ELSE
            v_action := 'insert_' || TG_TABLE_NAME;
        END IF;

    ELSIF (TG_OP = 'UPDATE') THEN
        v_entity_id := (NEW.id)::TEXT;
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);

        IF TG_TABLE_NAME = 'profiles' THEN
            v_action := 'profile_updated';
            v_user_id := NEW.id;
        ELSIF TG_TABLE_NAME = 'posts' THEN
            IF (OLD.is_deleted = FALSE AND NEW.is_deleted = TRUE) THEN
                v_action := 'post_deleted';
            ELSE
                v_action := 'post_edited';
            END IF;
            v_user_id := NEW.user_id;
        ELSIF TG_TABLE_NAME = 'follows' THEN
            v_action := 'follow_status_updated';
            v_entity_id := NEW.following_id::TEXT;
            v_user_id := NEW.following_id;
        ELSE
            v_action := 'update_' || TG_TABLE_NAME;
        END IF;

    ELSIF (TG_OP = 'DELETE') THEN
        v_old_data := to_jsonb(OLD);

        IF TG_TABLE_NAME = 'follows' THEN
            -- Check if this was the profile owner removing a follower or the follower unfollowing
            IF (v_user_id IS NOT NULL AND v_user_id = OLD.following_id) THEN
                v_action := 'follower_removed';
                v_entity_id := OLD.follower_id::TEXT;
                v_user_id := OLD.following_id;
            ELSE
                v_action := 'unfollowed';
                v_entity_id := OLD.following_id::TEXT;
                v_user_id := OLD.follower_id;
            END IF;
        ELSIF TG_TABLE_NAME = 'blocks' THEN
            v_action := 'unblocked';
            v_entity_id := OLD.blocked_id::TEXT;
            v_user_id := OLD.blocker_id;
        ELSE
            v_entity_id := (OLD.id)::TEXT;
            v_action := 'delete_' || TG_TABLE_NAME;
        END IF;
    END IF;

    -- Append log record
    INSERT INTO public.activity_log (
        user_id,
        action,
        entity_type,
        entity_id,
        old_data,
        new_data
    ) VALUES (
        v_user_id,
        v_action,
        v_entity_type,
        v_entity_id,
        v_old_data,
        v_new_data
    );

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach triggers for tables
CREATE TRIGGER tr_activity_log_profiles
AFTER INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.log_activity_event();

CREATE TRIGGER tr_activity_log_posts
AFTER INSERT OR UPDATE ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.log_activity_event();

CREATE TRIGGER tr_activity_log_follows
AFTER INSERT OR UPDATE OR DELETE ON public.follows
FOR EACH ROW EXECUTE FUNCTION public.log_activity_event();

CREATE TRIGGER tr_activity_log_blocks
AFTER INSERT OR DELETE ON public.blocks
FOR EACH ROW EXECUTE FUNCTION public.log_activity_event();

CREATE TRIGGER tr_activity_log_reports
AFTER INSERT ON public.reports
FOR EACH ROW EXECUTE FUNCTION public.log_activity_event();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES RLS
-- Anyone authenticated can view public profiles unless blocked
CREATE POLICY "Profiles readable if not blocked"
ON public.profiles FOR SELECT
USING (
    NOT EXISTS (
        SELECT 1 FROM public.blocks
        WHERE (blocker_id = auth.uid() AND blocked_id = profiles.id)
           OR (blocker_id = profiles.id AND blocked_id = auth.uid())
    )
);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- 2. POSTS RLS
-- Readable if active (not soft deleted) and not blocked
CREATE POLICY "Active posts readable if permitted and not blocked"
ON public.posts FOR SELECT
USING (
    is_deleted = FALSE
    AND NOT EXISTS (
        SELECT 1 FROM public.blocks
        WHERE (blocker_id = auth.uid() AND blocked_id = posts.user_id)
           OR (blocker_id = posts.user_id AND blocked_id = auth.uid())
    )
    AND (
        -- Owner can always view
        auth.uid() = user_id
        OR
        -- Public account
        EXISTS (SELECT 1 FROM public.profiles WHERE id = posts.user_id AND is_private = FALSE)
        OR
        -- Accepted follower of private account
        EXISTS (SELECT 1 FROM public.follows WHERE following_id = posts.user_id AND follower_id = auth.uid() AND status = 'accepted')
    )
);

CREATE POLICY "Users can insert their own posts"
ON public.posts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
ON public.posts FOR UPDATE
USING (auth.uid() = user_id);

-- Soft delete is executed as UPDATE is_deleted = TRUE. Hard delete is only permitted for post owner.
CREATE POLICY "Users can delete their own posts"
ON public.posts FOR DELETE
USING (auth.uid() = user_id);

-- 3. FOLLOWS RLS
CREATE POLICY "Follows readable by participants"
ON public.follows FOR SELECT
USING (
    auth.uid() = follower_id OR auth.uid() = following_id
    OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = follows.following_id AND is_private = TRUE)
);

CREATE POLICY "Users can follow other profiles"
ON public.follows FOR INSERT
WITH CHECK (
    auth.uid() = follower_id
    AND follower_id != following_id
    AND NOT EXISTS (
        SELECT 1 FROM public.blocks
        WHERE (blocker_id = auth.uid() AND blocked_id = following_id)
           OR (blocker_id = following_id AND blocked_id = auth.uid())
    )
);

CREATE POLICY "Profile owners can approve follow requests"
ON public.follows FOR UPDATE
USING (auth.uid() = following_id);

-- EITHER the follower can unfollow, OR the profile owner can REMOVE a follower!
CREATE POLICY "Follower can unfollow or Profile owner can remove follower"
ON public.follows FOR DELETE
USING (
    auth.uid() = follower_id OR auth.uid() = following_id
);

-- 4. BLOCKS RLS
CREATE POLICY "Users can view their own block list"
ON public.blocks FOR SELECT
USING (auth.uid() = blocker_id);

CREATE POLICY "Users can block others"
ON public.blocks FOR INSERT
WITH CHECK (auth.uid() = blocker_id AND blocker_id != blocked_id);

CREATE POLICY "Users can unblock others"
ON public.blocks FOR DELETE
USING (auth.uid() = blocker_id);

-- 5. REPORTS RLS
CREATE POLICY "Users can submit reports"
ON public.reports FOR INSERT
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view reports they submitted"
ON public.reports FOR SELECT
USING (auth.uid() = reporter_id);

-- 6. ACTIVITY LOG RLS (APPEND-ONLY)
-- Strictly read-only for the user's own actions
CREATE POLICY "Users can view their own activity history"
ON public.activity_log FOR SELECT
USING (auth.uid() = user_id);

-- Inserting is managed through SECURITY DEFINER triggers or user inserts
CREATE POLICY "Activity log append only"
ON public.activity_log FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- NO UPDATE POLICY (prohibits all updates)
-- NO DELETE POLICY (prohibits all deletes)
