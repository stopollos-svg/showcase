export type MediaType = 'image' | 'video' | 'audio';

export type FollowStatus = 'pending' | 'accepted' | 'none';

export interface Profile {
  id: string;
  business_name: string;
  bio: string;
  category: string;
  contact: string;
  avatar_url: string;
  is_private: boolean;
  is_verified?: boolean;
  verified_at?: string;
  verified_by?: string;
  created_at: string;
  updated_at: string;
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
  is_following?: boolean;
  follow_status?: FollowStatus;
}

export interface Post {
  id: string;
  user_id: string;
  media_type: MediaType;
  media_url: string;
  thumbnail_url?: string;
  caption: string;
  duration?: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  user?: Profile;
  likes_count?: number;
  like_count?: number;
  comments_count?: number;
  comment_count?: number;
  view_count?: number;
  share_count?: number;
  save_count?: number;
  trending_score?: number;
  trending_updated_at?: string;
  is_liked?: boolean;
}

export interface PostView {
  id: string;
  post_id: string;
  viewer_id?: string | null;
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  parent_comment_id?: string | null;
  body: string;
  content?: string; // alias
  is_pinned?: boolean;
  is_edited?: boolean;
  edited_at?: string | null;
  deleted_at?: string | null;
  created_at: string;
  updated_at?: string;
  user?: Profile;
  likes_count?: number;
  is_liked?: boolean;
  replies?: Comment[];
  mentioned_users?: string[];
}

export interface CommentLike {
  comment_id: string;
  user_id: string;
  created_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  actor_id: string;
  type: 'comment' | 'reply' | 'mention' | 'like' | 'follow';
  target_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  actor?: Profile;
}

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: Profile;
  recipient?: Profile;
}

export interface Conversation {
  other_user: Profile;
  last_message: Message;
  unread_count: number;
  can_send_next: boolean;
  waiting_reason?: string;
}

export interface Follow {
  follower_id: string;
  following_id: string;
  status: 'pending' | 'accepted';
  created_at: string;
  follower_profile?: Profile;
  following_profile?: Profile;
}

export interface Block {
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  target_type: 'post' | 'profile' | 'comment';
  target_id: string;
  reason: string;
  details?: string;
  status?: 'open' | 'in_review' | 'resolved' | 'dismissed';
  created_at: string;
  reporter?: Profile;
}

export interface VerificationRequest {
  id: string;
  user_id: string;
  business_name: string;
  category: string;
  proof_url: string;
  contact: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  created_at: string;
  user?: Profile;
}

export interface StaffRole {
  user_id: string;
  role: 'admin' | 'moderator';
  created_at: string;
  created_by?: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action:
    | 'signup'
    | 'profile_updated'
    | 'post_created'
    | 'post_edited'
    | 'post_deleted'
    | 'comment_created'
    | 'comment_edited'
    | 'comment_deleted'
    | 'comment_pinned'
    | 'comment_unpinned'
    | 'comment_moderated'
    | 'comment_liked'
    | 'message_sent'
    | 'followed'
    | 'unfollowed'
    | 'follower_removed'
    | 'blocked'
    | 'unblocked'
    | 'reported'
    | 'verified_approved'
    | 'verified_rejected'
    | string;
  entity_type: string;
  entity_id: string;
  old_data: Record<string, any> | null;
  new_data: Record<string, any> | null;
  created_at: string;
}

export interface BusinessCategory {
  id: string;
  name: string;
  description: string;
}

export const BUSINESS_CATEGORIES: BusinessCategory[] = [
  { id: 'all', name: 'All Crafts', description: 'Explore all artisan businesses' },
  { id: 'coffee', name: 'Coffee & Roasting', description: 'Micro-roasters & specialty beans' },
  { id: 'bakery', name: 'Bakery & Pastry', description: 'Artisan breads, sourdough & treats' },
  { id: 'crafts', name: 'Ceramics & Pottery', description: 'Wheel-thrown clay, vases & homeware' },
  { id: 'leather', name: 'Leather & Tailoring', description: 'Bespoke goods, bags & apparel' },
  { id: 'farming', name: 'Urban Farming & Flora', description: 'Fresh produce, plants & floral design' },
  { id: 'woodwork', name: 'Wood & Furniture', description: 'Custom carpentry & reclaimed woodwork' },
  { id: 'services', name: 'Creative Services', description: 'Design, repair & small trade studios' },
];
