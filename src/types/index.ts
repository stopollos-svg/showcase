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
  is_liked?: boolean;
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
  target_type: 'post' | 'profile';
  target_id: string;
  reason: string;
  details?: string;
  created_at: string;
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
    | 'followed'
    | 'unfollowed'
    | 'follower_removed'
    | 'blocked'
    | 'unblocked'
    | 'reported'
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
