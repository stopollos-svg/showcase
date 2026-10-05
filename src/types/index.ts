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
  location?: string;
  country?: string;
  district?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  distance_km?: number;
  is_verified?: boolean;
  verified_at?: string;
  verified_by?: string;
  created_at: string;
  updated_at: string;
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
  rating?: number;
  review_count?: number;
  is_following?: boolean;
  follow_status?: FollowStatus;
  has_completed_tour?: boolean;
  tour_completed_at?: string;
  tour_step?: number;
}

export type DeletionReason = 'user_deleted' | 'moderator_removed' | 'admin_purged';

export interface Post {
  id: string;
  user_id: string;
  media_type: MediaType;
  media_url: string;
  thumbnail_url?: string;
  caption: string;
  duration?: number;
  is_deleted: boolean;
  deleted_at?: string | null;
  deleted_by?: string | null;
  deletion_reason?: DeletionReason | null;
  purge_eligible_at?: string | null;
  purged_at?: string | null;
  location?: string;
  country?: string;
  district?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  distance_km?: number;
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
  deleted_by?: string | null;
  deletion_reason?: DeletionReason | null;
  purge_eligible_at?: string | null;
  purged_at?: string | null;
  created_at: string;
  updated_at?: string;
  user?: Profile;
  likes_count?: number;
  is_liked?: boolean;
  replies?: Comment[];
  mentioned_users?: string[];
}

export interface RetentionPolicy {
  content_type: 'post' | 'comment';
  deletion_reason: 'user_deleted' | 'moderator_removed';
  retention_days: number;
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

export interface DailyEngagementPoint {
  date: string;
  dateLabel: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  engagementRate: number;
}

export interface PostMetricPoint {
  id: string;
  caption: string;
  shortCaption: string;
  media_type: MediaType;
  media_url: string;
  thumbnail_url?: string;
  created_at: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  engagementRate: number;
  trendingScore: number;
}

export interface MediaTypeBreakdown {
  name: string;
  type: MediaType;
  count: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  avgEngagement: number;
  color: string;
}

export interface HourlyDistributionPoint {
  slot: string;
  label: string;
  views: number;
  interactions: number;
}

export interface BusinessInsightsData {
  business: Profile;
  timeRange: '7d' | '30d' | 'all';
  summary: {
    totalPosts: number;
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    totalSaves: number;
    overallEngagementRate: number; // percentage (e.g. 8.4)
    bestPerformingFormat: string;
    viewsVelocity24h: number;
    likesRatio: number; // % of viewers who liked
  };
  dailyTimeline: DailyEngagementPoint[];
  postPerformance: PostMetricPoint[];
  mediaBreakdown: MediaTypeBreakdown[];
  hourlyDistribution: HourlyDistributionPoint[];
  growthRecommendations: string[];
}

export const BUSINESS_CATEGORIES: BusinessCategory[] = [
  { id: 'all', name: 'All Discoveries', description: 'Explore all venues, spots and businesses' },
  { id: 'coffee', name: '☕ Coffee & Roasters', description: 'Specialty roasters, artisan cafes & single-origin coffee' },
  { id: 'events', name: '🎪 Events & Pop-ups', description: 'Festivals, live sessions, craft markets & tastings' },
  { id: 'hangouts', name: '🌿 Hangouts & Creative Spaces', description: 'Art studios, open courtyards, coworking spaces & gardens' },
  { id: 'restaurants', name: '🍽️ Restaurants & Dining', description: 'Local gastronomy, grills, garden dining & bistros' },
  { id: 'bakery', name: '🥐 Bakery & Pastry', description: 'Wild sourdough, fresh pastries & morning hearth breads' },
  { id: 'crafts', name: '🏺 Ceramics & Pottery', description: 'Wheel-thrown clay, vases & homeware' },
  { id: 'leather', name: '🧵 Leather & Tailoring', description: 'Bespoke goods, bags & fine apparel' },
  { id: 'woodwork', name: '🪵 Wood & Furniture', description: 'Custom carpentry & reclaimed woodwork' },
  { id: 'farming', name: '🌱 Urban Farming & Flora', description: 'Fresh produce, plants & floral design' },
];

export interface LocationDistrict {
  id: string;
  name: string;
  city: string;
  country_code: string;
  latitude: number;
  longitude: number;
  highlight?: string;
}

export interface LocationCountry {
  code: string;
  name: string;
  flag: string;
  defaultDistrictId: string;
  districts: LocationDistrict[];
}

export interface GeoLocationCoords {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export type TransactionStatus = 'settled' | 'pending' | 'refunded' | 'disputed' | 'cancelled';

export type TransactionType =
  | 'craft_order'
  | 'custom_commission'
  | 'workshop_ticket'
  | 'patronage_tip'
  | 'booth_sale';

export type PaymentMethod = 'credit_card' | 'apple_pay' | 'market_cash' | 'direct_transfer';

export interface Transaction {
  id: string;
  reference_id: string; // e.g. TXN-2026-8910
  buyer_id: string;
  seller_id: string;
  item_type: TransactionType;
  item_title: string;
  post_id?: string;
  amount_cents: number; // in cents ($50.00 = 5000)
  fee_cents: number; // platform fee in cents (5%)
  payout_cents: number; // net payout to artisan in cents
  currency: string; // 'USD'
  status: TransactionStatus;
  payment_method: PaymentMethod;
  notes?: string;
  buyer?: Profile;
  seller?: Profile;
  created_at: string;
  settled_at?: string | null;
  refunded_at?: string | null;
  disputed_at?: string | null;
  dispute_reason?: string | null;
  shipping_address?: string;
  customer_email?: string;
}

export interface TransactionAuditLog {
  id: string;
  transaction_id: string;
  reference_id: string;
  admin_id: string;
  admin_name: string;
  action:
    | 'created'
    | 'settled'
    | 'refunded'
    | 'disputed'
    | 'resolved'
    | 'fee_adjusted'
    | 'manual_entry'
    | 'status_changed';
  previous_status?: TransactionStatus;
  new_status: TransactionStatus;
  amount_affected_cents?: number;
  reason: string;
  created_at: string;
}

export interface FinancialSummary {
  totalGmvCents: number;
  settledVolumeCents: number;
  platformRevenueCents: number;
  pendingPayoutsCents: number;
  refundedVolumeCents: number;
  totalTransactions: number;
  settledCount: number;
  pendingCount: number;
  disputedCount: number;
  refundedCount: number;
  averageOrderValueCents: number;
}

export interface BusinessReview {
  id: string;
  business_id: string;
  user_id: string;
  author_name: string;
  author_avatar?: string;
  rating: number; // 1 to 5
  title: string;
  comment: string;
  tags?: string[];
  helpful_votes?: number;
  helpful_user_ids?: string[];
  is_verified_patron?: boolean;
  visit_date?: string;
  created_at: string;
  updated_at?: string;
}

export interface ReviewSuggestionPrompt {
  category: string;
  tags: string[];
  sentenceStarters: string[];
}

export interface SearchAutoSuggestion {
  id: string;
  type: 'business' | 'category' | 'district' | 'query';
  title: string;
  subtitle?: string;
  category?: string;
  district?: string;
  avatar_url?: string;
  rating?: number;
  query: string;
  highlightMatch?: string;
}

export const REVIEW_SUGGESTIONS_BY_CATEGORY: Record<string, ReviewSuggestionPrompt> = {
  coffee: {
    category: 'coffee',
    tags: [
      'Single-origin Bugisu',
      'Flawless Chemex pour',
      'Rich crema',
      'Cozy garden patio',
      'Great barista crew',
      'Fast Wi-Fi',
      'Quiet workspace',
    ],
    sentenceStarters: [
      'The single-origin pour-over had extraordinary notes of',
      'One of the best specialty roasters in Kampala because',
      'Quiet leafy courtyard with flawlessly extracted espresso and',
      'Must-visit spot for specialty coffee lovers seeking',
    ],
  },
  restaurants: {
    category: 'restaurants',
    tags: [
      'Fresh Lake Victoria Tilapia',
      'Lush acacia garden',
      'Flavorful marinades',
      'Romantic evening lighting',
      'Attentive service',
      'Sweet plantain crisps',
      'Craft cocktails',
    ],
    sentenceStarters: [
      'Dining under the garden acacia canopy in Kololo was',
      'Their grilled Lake Victoria whole tilapia with chili glaze was',
      'Flavors were exceptionally balanced and table service was',
      'Wonderful dinner atmosphere in Kampala with',
    ],
  },
  events: {
    category: 'events',
    tags: [
      'Vibrant weekend energy',
      'Curated vinyl selectors',
      'Live acoustic Kora',
      'Talented local artisans',
      'Craft ciders & eats',
      'Great sound quality',
      'Welcoming community',
    ],
    sentenceStarters: [
      'The live acoustic performance and artisan market energy were',
      'Discovered so many authentic Ugandan makers and',
      'The curated vinyl selections set the perfect sundowner vibe for',
      'Unmissable weekend festival experience in Bugolobi with',
    ],
  },
  hangouts: {
    category: 'hangouts',
    tags: [
      'Creative community',
      'Inspiring open studios',
      'Lake Victoria breeze',
      'Peaceful courtyard',
      'Great artisan workshops',
      'Productive workspace',
      'Warm hospitality',
    ],
    sentenceStarters: [
      'Such an inspiring and peaceful creative hub in',
      'Spent a wonderful afternoon working in their open courtyard with',
      'The community art workshops and pottery studio feel so',
      'A serene hidden oasis in Kampala perfect for',
    ],
  },
  bakery: {
    category: 'bakery',
    tags: [
      'Wild sourdough ear',
      'Morning cardamom buns',
      'Cultured butter pastry',
      'Fresh out of the hearth',
      'Stoneground spelt',
    ],
    sentenceStarters: [
      'The crust check on their sourdough was unreal and',
      'Arrived early for hot cardamom buns and found',
      'Authentic French technique with delicious artisan hearth bread and',
    ],
  },
  crafts: {
    category: 'crafts',
    tags: [
      'Hand-thrown stoneware',
      'Natural wood ash glaze',
      'Heirloom durability',
      'Tactile speckled clay',
      'Beautiful studio courtyard',
    ],
    sentenceStarters: [
      'The ceramic forms have an exquisite tactile finish and',
      'Meeting the artisan in the studio workshop revealed',
    ],
  },
  default: {
    category: 'default',
    tags: [
      'Authentic craft',
      'Warm Ugandan hospitality',
      'Highly recommended',
      'Great attention to detail',
      'Fair pricing',
      'Unique ambiance',
    ],
    sentenceStarters: [
      'I was thoroughly impressed by their craftsmanship and',
      'The experience was memorable because',
      'A true local gem in the neighborhood with',
    ],
  },
};

export interface FeedbackSurveyOption {
  id: string;
  text: string;
  votes: number;
}

export interface FeedbackSurvey {
  id: string;
  business_id: string;
  question: string;
  category?: string; // e.g. 'Future Product', 'New Roast', 'Workshop', 'Menu Drop'
  options: FeedbackSurveyOption[];
  total_votes: number;
  voter_user_ids?: Record<string, string>; // userId -> optionId
  is_active: boolean;
  created_at: string;
}

export interface ArtisanEvent {
  id: string;
  title: string;
  description: string;
  category: 'coffee' | 'events' | 'restaurants' | 'crafts' | 'workshop' | 'music';
  host_business_id: string;
  host_name: string;
  host_avatar?: string;
  start_time: string; // ISO format
  end_time: string; // ISO format
  location_name: string;
  district: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  cover_image?: string;
  attendees_count: number;
  rsvp_user_ids: string[];
  featured_post_id?: string;
  created_at: string;
}

export interface GoogleNewsArticle {
  id: string;
  title: string;
  snippet: string;
  source: string;
  published_at: string;
  category: 'coffee' | 'arts' | 'gastronomy' | 'economy';
  url: string;
  image_url?: string;
  topic_label: string;
}

export interface OnboardingTourStep {
  id: string;
  title: string;
  badge: string;
  description: string;
  targetFeature: 'profile_editor' | 'create_post' | 'insights_dashboard' | 'events_tracker' | 'messaging';
  iconName: string;
  actionButtonText: string;
  highlights: string[];
}

export interface OnboardingTourRecord {
  user_id: string;
  is_completed: boolean;
  current_step: number;
  completed_at?: string;
  updated_at: string;
}


