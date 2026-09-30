-- ==============================================================================
-- Migration: 20260928000001_comments_messages_admin.sql
-- Amapati: Comments, Messaging with Reply Protection, Staff Roles, and Verification
-- ==============================================================================

-- 1. COMMENTS TABLE
-- Small business showcases comments with Row Level Security (RLS)
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(trim(content)) > 0 AND char_length(content) <= 1000),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Indexes for rapid comment retrieval per post
CREATE INDEX IF NOT EXISTS idx_comments_post_created ON public.comments(post_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_comments_user_created ON public.comments(user_id, created_at DESC);

-- Enable RLS on comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Select policy: Anyone (including unauthenticated guests) can view comments on non-deleted posts,
-- excluding blocked users
CREATE POLICY comments_select_policy ON public.comments
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

-- Insert policy: Authenticated user can post comments as themselves
CREATE POLICY comments_insert_policy ON public.comments
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM public.posts p
            WHERE p.id = comments.post_id AND p.is_deleted = FALSE
        )
        AND NOT EXISTS (
            SELECT 1 FROM public.blocks b
            WHERE (b.blocker_id = auth.uid() AND b.blocked_id = (SELECT user_id FROM public.posts WHERE id = comments.post_id))
               OR (b.blocker_id = (SELECT user_id FROM public.posts WHERE id = comments.post_id) AND b.blocked_id = auth.uid())
        )
    );

-- Delete policy: Comment author OR the post owner can delete comments
CREATE POLICY comments_delete_policy ON public.comments
    FOR DELETE
    TO authenticated
    USING (
        auth.uid() = user_id
        OR auth.uid() = (
            SELECT user_id FROM public.posts WHERE id = comments.post_id
        )
    );

-- 2. MESSAGES TABLE WITH INBOX REPLY LIMIT
-- Direct messaging between small businesses
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(trim(content)) > 0 AND char_length(content) <= 2000),
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    CONSTRAINT chk_no_self_message CHECK (sender_id <> recipient_id)
);

CREATE INDEX IF NOT EXISTS idx_messages_participants ON public.messages(sender_id, recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_unread ON public.messages(recipient_id, is_read) WHERE is_read = FALSE;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Select policy: Users can only see messages where they are sender or recipient
CREATE POLICY messages_select_policy ON public.messages
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() IN (sender_id, recipient_id)
    );

-- Helper function: Check if sender can send message to recipient
-- Rule: Limit message sending when there is no reply in the inbox.
-- If the sender has sent an outreach message to recipient, sender cannot send another until recipient has replied!
CREATE OR REPLACE FUNCTION public.can_send_message(p_sender UUID, p_recipient UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_last_sender UUID;
BEGIN
    -- Cannot message blocked users
    IF EXISTS (
        SELECT 1 FROM public.blocks
        WHERE (blocker_id = p_sender AND blocked_id = p_recipient)
           OR (blocker_id = p_recipient AND blocked_id = p_sender)
    ) THEN
        RETURN FALSE;
    END IF;

    -- Check last message in conversation
    SELECT sender_id INTO v_last_sender
    FROM public.messages
    WHERE (sender_id = p_sender AND recipient_id = p_recipient)
       OR (sender_id = p_recipient AND recipient_id = p_sender)
    ORDER BY created_at DESC
    LIMIT 1;

    -- If no prior message, sender may send initial message
    IF v_last_sender IS NULL THEN
        RETURN TRUE;
    END IF;

    -- If last sender was the recipient, recipient has replied! Sender can send.
    IF v_last_sender = p_recipient THEN
        RETURN TRUE;
    END IF;

    -- If last sender was sender, sender is waiting for a reply: cannot spam
    RETURN FALSE;
END;
$$;

-- Insert policy: User must be sender and can_send_message must be TRUE
CREATE POLICY messages_insert_policy ON public.messages
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = sender_id
        AND public.can_send_message(sender_id, recipient_id)
    );

-- Update policy: Recipient can mark messages as read
CREATE POLICY messages_update_policy ON public.messages
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = recipient_id)
    WITH CHECK (auth.uid() = recipient_id);

-- 3. STAFF ROLES & VERIFIED BADGES (PHASE 5 ADMIN)
-- Add verification columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified_by UUID DEFAULT NULL;

-- Staff roles table
CREATE TABLE IF NOT EXISTS public.staff_roles (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'moderator')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

ALTER TABLE public.staff_roles ENABLE ROW LEVEL SECURITY;

-- Helper functions for role checks in RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.staff_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_moderator()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.staff_roles
        WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
    );
$$;

-- Staff roles policy: only admins can view or manage staff roles
CREATE POLICY staff_roles_select_policy ON public.staff_roles
    FOR SELECT
    TO authenticated
    USING (public.is_moderator());

CREATE POLICY staff_roles_admin_policy ON public.staff_roles
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Verification requests table
CREATE TABLE IF NOT EXISTS public.verification_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    category TEXT NOT NULL,
    proof_url TEXT NOT NULL,
    contact TEXT NOT NULL,
    notes TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ DEFAULT NULL,
    rejection_reason TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

-- User can view their own requests, staff can view all
CREATE POLICY verification_requests_select ON public.verification_requests
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR public.is_moderator());

-- User can insert their own request
CREATE POLICY verification_requests_insert ON public.verification_requests
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Only admins can update verification status
CREATE POLICY verification_requests_update ON public.verification_requests
    FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 4. ACTIVITY LOG TRIGGERS FOR COMMENTS & MESSAGING
CREATE OR REPLACE FUNCTION public.trg_log_comments()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.activity_log(user_id, action, entity_type, entity_id, new_data)
        VALUES (NEW.user_id, 'comment_created', 'comment', NEW.id::text, row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO public.activity_log(user_id, action, entity_type, entity_id, old_data)
        VALUES (auth.uid(), 'comment_deleted', 'comment', OLD.id::text, row_to_json(OLD)::jsonb);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_comments_audit ON public.comments;
CREATE TRIGGER trg_comments_audit
    AFTER INSERT OR DELETE ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.trg_log_comments();
