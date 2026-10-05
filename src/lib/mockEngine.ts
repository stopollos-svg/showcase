import {
  ActivityLog,
  AppNotification,
  Block,
  Comment,
  CommentLike,
  Conversation,
  Follow,
  FollowStatus,
  Message,
  Post,
  Profile,
  Report,
  StaffRole,
  VerificationRequest,
  PostView,
  RetentionPolicy,
  DeletionReason,
  BusinessInsightsData,
  DailyEngagementPoint,
  PostMetricPoint,
  MediaTypeBreakdown,
  HourlyDistributionPoint,
  MediaType,
  Transaction,
  TransactionStatus,
  TransactionType,
  PaymentMethod,
  TransactionAuditLog,
  FinancialSummary,
  GeoLocationCoords,
  BusinessReview,
  SearchAutoSuggestion,
  FeedbackSurvey,
  FeedbackSurveyOption,
  OnboardingTourRecord,
} from '../types';
import { calculateDistanceKm } from './locationData';

const DB_STORAGE_KEY = 'amapati_db_v10';

export interface DatabaseState {
  profiles: Profile[];
  posts: Post[];
  postViews: PostView[];
  follows: Follow[];
  blocks: Block[];
  reports: Report[];
  comments: Comment[];
  commentLikes: CommentLike[];
  notifications: AppNotification[];
  messages: Message[];
  staffRoles: StaffRole[];
  verificationRequests: VerificationRequest[];
  activityLogs: ActivityLog[];
  retentionPolicies: RetentionPolicy[];
  transactions: Transaction[];
  transactionAuditLogs: TransactionAuditLog[];
  reviews: BusinessReview[];
  surveys: FeedbackSurvey[];
  onboardingTours: OnboardingTourRecord[];
}

const INITIAL_RETENTION_POLICIES: RetentionPolicy[] = [
  { content_type: 'post', deletion_reason: 'user_deleted', retention_days: 30 },
  { content_type: 'post', deletion_reason: 'moderator_removed', retention_days: 14 },
  { content_type: 'comment', deletion_reason: 'user_deleted', retention_days: 30 },
  { content_type: 'comment', deletion_reason: 'moderator_removed', retention_days: 14 },
];

const INITIAL_PROFILES: Profile[] = [
  {
    id: 'user_endiro',
    business_name: 'Endiro Coffee',
    bio: 'Tree-to-cup Ugandan specialty Arabica coffee grown by women farmers on Mt. Elgon. Hand-poured Chemex, V60, and chilled cold brews.',
    category: 'coffee',
    contact: '+256 700 123456',
    avatar_url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&auto=format&fit=crop&q=80',
    is_private: false,
    location: 'Kololo, Kampala, Uganda',
    country: 'UG',
    district: 'ug_kololo',
    city: 'Kampala',
    latitude: 0.3276,
    longitude: 32.5936,
    is_verified: true,
    created_at: '2026-09-15T08:00:00Z',
    updated_at: '2026-09-15T08:00:00Z',
  },
  {
    id: 'user_designhub',
    business_name: 'Design Hub Kampala',
    bio: 'Creative coworking warehouse, artisan maker market, open-air garden terrace, and cultural craft exhibitions in Industrial Area.',
    category: 'hangouts',
    contact: 'info@designhubkampala.com',
    avatar_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&auto=format&fit=crop&q=80',
    is_private: false,
    location: 'Bugolobi, Kampala, Uganda',
    country: 'UG',
    district: 'ug_bugolobi',
    city: 'Kampala',
    latitude: 0.3168,
    longitude: 32.6247,
    is_verified: true,
    created_at: '2026-09-16T10:00:00Z',
    updated_at: '2026-09-16T10:00:00Z',
  },
  {
    id: 'user_thelawns',
    business_name: 'The Lawns Restaurant & Lounge',
    bio: 'Lush garden dining in Kololo serving East African grilled tilapia, fusion game meats, and handcrafted cocktails.',
    category: 'restaurants',
    contact: '+256 756 889900',
    avatar_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&auto=format&fit=crop&q=80',
    is_private: false,
    location: 'Kololo, Kampala, Uganda',
    country: 'UG',
    district: 'ug_kololo',
    city: 'Kampala',
    latitude: 0.3276,
    longitude: 32.5936,
    is_verified: true,
    created_at: '2026-09-17T11:00:00Z',
    updated_at: '2026-09-17T11:00:00Z',
  },
  {
    id: 'user_events_kampala',
    business_name: 'Kampala Craft & Vinyl Sundowner',
    bio: 'Monthly weekend pop-up festival celebrating East African artisan crafts, acoustic live music, vinyl selectors & street food.',
    category: 'events',
    contact: 'events@kampalasundowner.ug',
    avatar_url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&auto=format&fit=crop&q=80',
    is_private: false,
    location: 'Bugolobi, Kampala, Uganda',
    country: 'UG',
    district: 'ug_bugolobi',
    city: 'Kampala',
    latitude: 0.3168,
    longitude: 32.6247,
    is_verified: true,
    created_at: '2026-09-18T14:00:00Z',
    updated_at: '2026-09-18T14:00:00Z',
  },
  {
    id: 'user_1000cups',
    business_name: '1000 Cups Coffee House',
    bio: "Uganda's pioneering specialty coffee house. Single-origin Bugisu, Rwenzori Arabica & freshly roasted espresso in central Nakasero.",
    category: 'coffee',
    contact: '+256 414 345678',
    avatar_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&auto=format&fit=crop&q=80',
    is_private: false,
    location: 'Nakasero, Kampala, Uganda',
    country: 'UG',
    district: 'ug_nakasero',
    city: 'Kampala',
    latitude: 0.3204,
    longitude: 32.5768,
    is_verified: true,
    created_at: '2026-09-19T09:00:00Z',
    updated_at: '2026-09-19T09:00:00Z',
  },
  {
    id: 'user_32east',
    business_name: '32° East | Ugandan Arts Trust',
    bio: 'Center for contemporary art, community studios, clay workshops & peaceful courtyard coffee hangout in Ggaba.',
    category: 'hangouts',
    contact: 'hello@32east.org',
    avatar_url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&auto=format&fit=crop&q=80',
    is_private: false,
    location: 'Muyenga & Ggaba, Kampala, Uganda',
    country: 'UG',
    district: 'ug_muyenga',
    city: 'Kampala',
    latitude: 0.2974,
    longitude: 32.6148,
    is_verified: true,
    created_at: '2026-09-19T14:00:00Z',
    updated_at: '2026-09-19T14:00:00Z',
  },
  {
    id: 'user_cafejavas',
    business_name: 'Cafe Javas Lugogo',
    bio: 'Famous Kampala meeting spot. Gourmet breakfast skillets, craft iced coffees, fresh fruit smoothies, and late evening dining.',
    category: 'restaurants',
    contact: '+256 312 000111',
    avatar_url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&auto=format&fit=crop&q=80',
    is_private: false,
    location: 'Kampala Central, Uganda',
    country: 'UG',
    district: 'ug_kampala_central',
    city: 'Kampala',
    latitude: 0.3250,
    longitude: 32.6050,
    is_verified: true,
    created_at: '2026-09-19T16:00:00Z',
    updated_at: '2026-09-19T16:00:00Z',
  },
  {
    id: 'user_coffee',
    business_name: 'Bella Terra Roasters',
    bio: 'Micro-batch single-origin coffees roasted weekly over cast iron. Ethically sourced from shade-grown highland farms.',
    category: 'coffee',
    contact: '+1 (555) 382-9901',
    avatar_url: '/src/assets/images/coffee_roaster_1790587302699.jpg',
    is_private: false,
    location: 'Portland, OR, USA',
    country: 'US',
    district: 'us_portland',
    city: 'Portland',
    latitude: 45.5152,
    longitude: -122.6784,
    is_verified: true,
    created_at: '2026-09-20T08:00:00Z',
    updated_at: '2026-09-20T08:00:00Z',
  },
  {
    id: 'user_ceramics',
    business_name: 'Nadia Studio Ceramics',
    bio: 'Slow-crafted stoneware and functional tableware glazed with natural wood ash. Hand-thrown in our sunny courtyard workshop.',
    category: 'crafts',
    contact: 'hello@nadiastudio.craft',
    avatar_url: '/src/assets/images/ceramic_studio_1790587319737.jpg',
    is_private: false,
    location: 'Kyoto, Japan',
    country: 'JP',
    district: 'jp_kyoto',
    city: 'Kyoto',
    latitude: 35.0116,
    longitude: 135.7681,
    is_verified: true,
    created_at: '2026-09-21T09:30:00Z',
    updated_at: '2026-09-21T09:30:00Z',
  },
  {
    id: 'user_bakery',
    business_name: 'Levain & Crust Bakery',
    bio: '36-hour cold-fermented wild sourdough, morning cardamom buns, and seasonal stone-fruit galettes. Baked fresh before sunrise.',
    category: 'bakery',
    contact: 'order@levaincrust.com',
    avatar_url: '/src/assets/images/bakery_pastry_1790587333429.jpg',
    is_private: false,
    location: 'Paris, France',
    country: 'FR',
    district: 'fr_paris',
    city: 'Paris',
    latitude: 48.8566,
    longitude: 2.3522,
    is_verified: false,
    created_at: '2026-09-22T05:00:00Z',
    updated_at: '2026-09-22T05:00:00Z',
  },
  {
    id: 'user_leather',
    business_name: 'Sartoria Bespoke Goods',
    bio: 'Hand-stitched vegetable-tanned leather totes, briefcases, and brass-buckled belts. Built with heirloom durability.',
    category: 'leather',
    contact: '+1 (555) 891-2300',
    avatar_url: '/src/assets/images/leather_tailor_1790587348791.jpg',
    is_private: false,
    location: 'Milan, Italy',
    country: 'IT',
    district: 'it_milan',
    city: 'Milan',
    latitude: 45.4642,
    longitude: 9.1900,
    is_verified: false,
    created_at: '2026-09-23T11:15:00Z',
    updated_at: '2026-09-23T11:15:00Z',
  },
  {
    id: 'user_admin',
    business_name: 'Amapati Staff & Trust',
    bio: 'Official Amapati community moderation and business verification team.',
    category: 'services',
    contact: 'trust@amapati.app',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    is_private: false,
    location: 'San Francisco, CA, USA',
    country: 'US',
    district: 'us_sf',
    city: 'San Francisco',
    latitude: 37.7749,
    longitude: -122.4194,
    is_verified: true,
    created_at: '2026-09-18T00:00:00Z',
    updated_at: '2026-09-18T00:00:00Z',
  },
];

const INITIAL_POSTS: Post[] = [
  {
    id: 'post_1',
    user_id: 'user_coffee',
    media_type: 'image',
    media_url: '/src/assets/images/coffee_roaster_1790587302699.jpg',
    caption: 'First batch of the morning: Ethiopian Yirgacheffe washed beans hitting the cooling tray at first crack. Notes of jasmine, bergamot, and sweet stone fruit.',
    is_deleted: false,
    created_at: '2026-09-28T01:30:00Z',
    updated_at: '2026-09-28T01:30:00Z',
    likes_count: 42,
    like_count: 42,
    comments_count: 3,
    comment_count: 3,
    view_count: 195,
    share_count: 8,
    save_count: 14,
    trending_score: 22.4,
    trending_updated_at: '2026-09-28T03:00:00Z',
  },
  {
    id: 'post_coffee_2',
    user_id: 'user_coffee',
    media_type: 'video',
    media_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnail_url: '/src/assets/images/coffee_roaster_1790587302699.jpg',
    caption: 'Cupping table ritual: scoring acidity, sweetness, and tactile finish across four single-origin harvests from Huila, Colombia.',
    duration: 20,
    is_deleted: false,
    created_at: '2026-09-29T11:15:00Z',
    updated_at: '2026-09-29T11:15:00Z',
    likes_count: 84,
    like_count: 84,
    comments_count: 7,
    comment_count: 7,
    view_count: 410,
    share_count: 18,
    save_count: 29,
    trending_score: 38.6,
    trending_updated_at: '2026-09-29T12:00:00Z',
  },
  {
    id: 'post_coffee_3',
    user_id: 'user_coffee',
    media_type: 'image',
    media_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
    caption: 'Slow extraction cold brew tower running over 14 hours. Japanese Kyoto-style slow drip reveals incredible sweetness without bitterness.',
    is_deleted: false,
    created_at: '2026-09-26T14:00:00Z',
    updated_at: '2026-09-26T14:00:00Z',
    likes_count: 31,
    like_count: 31,
    comments_count: 2,
    comment_count: 2,
    view_count: 165,
    share_count: 6,
    save_count: 11,
    trending_score: 14.2,
    trending_updated_at: '2026-09-27T01:00:00Z',
  },
  {
    id: 'post_coffee_4',
    user_id: 'user_coffee',
    media_type: 'audio',
    media_url: 'https://actions.google.com/sounds/v1/water/rain_heavy.ogg',
    caption: 'Roaster notes audio log: Listening for the subtle difference between yellowing phase and exothermic first crack in cast iron.',
    duration: 45,
    is_deleted: false,
    created_at: '2026-09-25T08:30:00Z',
    updated_at: '2026-09-25T08:30:00Z',
    likes_count: 26,
    like_count: 26,
    comments_count: 4,
    comment_count: 4,
    view_count: 120,
    share_count: 4,
    save_count: 9,
    trending_score: 9.8,
    trending_updated_at: '2026-09-26T00:00:00Z',
  },
  {
    id: 'post_2',
    user_id: 'user_ceramics',
    media_type: 'image',
    media_url: '/src/assets/images/ceramic_studio_1790587319737.jpg',
    caption: 'New batch of fluted vase forms drying slowly under damp linen before their first bisque firing. Formed from speckled iron-rich stoneware clay.',
    is_deleted: false,
    created_at: '2026-09-27T18:45:00Z',
    updated_at: '2026-09-27T18:45:00Z',
    likes_count: 58,
    like_count: 58,
    comments_count: 2,
    comment_count: 2,
    view_count: 310,
    share_count: 12,
    save_count: 25,
    trending_score: 26.8,
    trending_updated_at: '2026-09-28T03:00:00Z',
  },
  {
    id: 'post_ceramics_2',
    user_id: 'user_ceramics',
    media_type: 'video',
    media_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnail_url: '/src/assets/images/ceramic_studio_1790587319737.jpg',
    caption: 'Centering and opening 3.5kg of local stoneware for our new sculptural planters. The rhythm of clay at 90 RPM.',
    duration: 18,
    is_deleted: false,
    created_at: '2026-09-29T14:30:00Z',
    updated_at: '2026-09-29T14:30:00Z',
    likes_count: 112,
    like_count: 112,
    comments_count: 8,
    comment_count: 8,
    view_count: 490,
    share_count: 22,
    save_count: 38,
    trending_score: 41.5,
    trending_updated_at: '2026-09-29T15:00:00Z',
  },
  {
    id: 'post_3',
    user_id: 'user_bakery',
    media_type: 'video',
    media_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnail_url: '/src/assets/images/bakery_pastry_1790587333429.jpg',
    caption: 'Morning crust check! Listen to that singing crackle right out of the hearth oven. 80% hydration country loaf with stoneground spelt.',
    duration: 15,
    is_deleted: false,
    created_at: '2026-09-27T14:20:00Z',
    updated_at: '2026-09-27T14:20:00Z',
    likes_count: 129,
    like_count: 129,
    comments_count: 1,
    comment_count: 1,
    view_count: 580,
    share_count: 24,
    save_count: 42,
    trending_score: 34.5,
    trending_updated_at: '2026-09-28T03:00:00Z',
  },
  {
    id: 'post_bakery_2',
    user_id: 'user_bakery',
    media_type: 'image',
    media_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80',
    caption: 'Cardamom morning buns rolled with fresh-ground green cardamom seeds and cultured French butter.',
    is_deleted: false,
    created_at: '2026-09-28T06:45:00Z',
    updated_at: '2026-09-28T06:45:00Z',
    likes_count: 73,
    like_count: 73,
    comments_count: 5,
    comment_count: 5,
    view_count: 320,
    share_count: 14,
    save_count: 22,
    trending_score: 28.1,
    trending_updated_at: '2026-09-28T08:00:00Z',
  },
  {
    id: 'post_4',
    user_id: 'user_leather',
    media_type: 'image',
    media_url: '/src/assets/images/leather_tailor_1790587348791.jpg',
    caption: 'Hand saddle-stitching our artisan market tote with waxed Irish linen thread. Two needles, one continuous seam designed to never unravel.',
    is_deleted: false,
    created_at: '2026-09-26T20:10:00Z',
    updated_at: '2026-09-26T20:10:00Z',
    likes_count: 36,
    like_count: 36,
    comments_count: 1,
    comment_count: 1,
    view_count: 160,
    share_count: 4,
    save_count: 11,
    trending_score: 11.2,
    trending_updated_at: '2026-09-28T03:00:00Z',
  },
  {
    id: 'post_leather_2',
    user_id: 'user_leather',
    media_type: 'video',
    media_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnail_url: '/src/assets/images/leather_tailor_1790587348791.jpg',
    caption: 'Edge burnishing vegetable tanned leather with natural beeswax and hard boxwood slicker. Glossy water-resistant edges.',
    duration: 16,
    is_deleted: false,
    created_at: '2026-09-28T16:00:00Z',
    updated_at: '2026-09-28T16:00:00Z',
    likes_count: 67,
    like_count: 67,
    comments_count: 4,
    comment_count: 4,
    view_count: 280,
    share_count: 11,
    save_count: 24,
    trending_score: 24.3,
    trending_updated_at: '2026-09-28T17:00:00Z',
  },
  {
    id: 'post_ug_endiro_1',
    user_id: 'user_endiro',
    media_type: 'video',
    media_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80',
    caption: 'Pouring fresh Mt. Elgon Bukonzo Arabica through the Chemex on our Kololo garden deck. Notes of blackcurrant, wild honey, and citrus zest. Sourced directly from women coffee growers in Mbale.',
    location: 'Kololo, Kampala, Uganda',
    country: 'UG',
    district: 'ug_kololo',
    city: 'Kampala',
    latitude: 0.3276,
    longitude: 32.5936,
    duration: 22,
    is_deleted: false,
    created_at: '2026-09-29T08:00:00Z',
    updated_at: '2026-09-29T08:00:00Z',
    likes_count: 94,
    like_count: 94,
    comments_count: 6,
    comment_count: 6,
    view_count: 520,
    share_count: 19,
    save_count: 34,
    trending_score: 44.2,
    trending_updated_at: '2026-09-29T09:00:00Z',
  },
  {
    id: 'post_ug_events_1',
    user_id: 'user_events_kampala',
    media_type: 'image',
    media_url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80',
    caption: 'This Saturday at the Bugolobi Warehouse: Kampala Craft & Vinyl Sundowner! 20+ independent local makers, live acoustic Kora sets, craft ciders, and vinyl selectors from 2 PM till late.',
    location: 'Bugolobi, Kampala, Uganda',
    country: 'UG',
    district: 'ug_bugolobi',
    city: 'Kampala',
    latitude: 0.3168,
    longitude: 32.6247,
    is_deleted: false,
    created_at: '2026-09-29T10:30:00Z',
    updated_at: '2026-09-29T10:30:00Z',
    likes_count: 145,
    like_count: 145,
    comments_count: 12,
    comment_count: 12,
    view_count: 780,
    share_count: 38,
    save_count: 55,
    trending_score: 58.7,
    trending_updated_at: '2026-09-29T11:00:00Z',
  },
  {
    id: 'post_ug_thelawns_1',
    user_id: 'user_thelawns',
    media_type: 'video',
    media_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
    caption: 'Dinner under the Kololo acacia canopy. Whole charcoal-grilled Lake Victoria Tilapia marinated in lemongrass, ginger & local chili glaze with sweet plantain crisps.',
    location: 'Kololo, Kampala, Uganda',
    country: 'UG',
    district: 'ug_kololo',
    city: 'Kampala',
    latitude: 0.3276,
    longitude: 32.5936,
    duration: 19,
    is_deleted: false,
    created_at: '2026-09-28T19:00:00Z',
    updated_at: '2026-09-28T19:00:00Z',
    likes_count: 118,
    like_count: 118,
    comments_count: 8,
    comment_count: 8,
    view_count: 640,
    share_count: 25,
    save_count: 41,
    trending_score: 48.9,
    trending_updated_at: '2026-09-28T20:00:00Z',
  },
  {
    id: 'post_ug_designhub_1',
    user_id: 'user_designhub',
    media_type: 'image',
    media_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80',
    caption: 'Open studio Friday at Design Hub Bugolobi! Resident woodcarvers, bark cloth artisans, and sustainable textile makers are showcasing their newest creations. Grab an iced cold brew and explore.',
    location: 'Bugolobi, Kampala, Uganda',
    country: 'UG',
    district: 'ug_bugolobi',
    city: 'Kampala',
    latitude: 0.3168,
    longitude: 32.6247,
    is_deleted: false,
    created_at: '2026-09-28T14:15:00Z',
    updated_at: '2026-09-28T14:15:00Z',
    likes_count: 82,
    like_count: 82,
    comments_count: 5,
    comment_count: 5,
    view_count: 430,
    share_count: 14,
    save_count: 28,
    trending_score: 32.5,
    trending_updated_at: '2026-09-28T15:00:00Z',
  },
  {
    id: 'post_ug_1000cups_1',
    user_id: 'user_1000cups',
    media_type: 'image',
    media_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop&q=80',
    caption: 'Traditional clay pot coffee brewing with fresh ginger & cardamom pods on Nakasero Hill. Celebrating 20 years of championing Bugisu AA and Rwenzori single origin beans.',
    location: 'Nakasero, Kampala, Uganda',
    country: 'UG',
    district: 'ug_nakasero',
    city: 'Kampala',
    latitude: 0.3204,
    longitude: 32.5768,
    is_deleted: false,
    created_at: '2026-09-28T09:00:00Z',
    updated_at: '2026-09-28T09:00:00Z',
    likes_count: 97,
    like_count: 97,
    comments_count: 7,
    comment_count: 7,
    view_count: 510,
    share_count: 21,
    save_count: 36,
    trending_score: 37.1,
    trending_updated_at: '2026-09-28T10:00:00Z',
  },
  {
    id: 'post_ug_32east_1',
    user_id: 'user_32east',
    media_type: 'video',
    media_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&auto=format&fit=crop&q=80',
    caption: 'Community clay sculpting and ceramic glazing session on the courtyard lawn in Muyenga overlooking Lake Victoria. Free public creative workshop every second Saturday.',
    location: 'Muyenga & Ggaba, Kampala, Uganda',
    country: 'UG',
    district: 'ug_muyenga',
    city: 'Kampala',
    latitude: 0.2974,
    longitude: 32.6148,
    duration: 24,
    is_deleted: false,
    created_at: '2026-09-27T16:00:00Z',
    updated_at: '2026-09-27T16:00:00Z',
    likes_count: 76,
    like_count: 76,
    comments_count: 4,
    comment_count: 4,
    view_count: 390,
    share_count: 12,
    save_count: 22,
    trending_score: 30.2,
    trending_updated_at: '2026-09-27T17:00:00Z',
  },
  {
    id: 'post_ug_cafejavas_1',
    user_id: 'user_cafejavas',
    media_type: 'image',
    media_url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=80',
    caption: 'Weekend brunch favorites: Belgian waffle towers with passion fruit coulis, fresh avocado sourdough melt, and our signature iced Mocha Caramel crunch.',
    location: 'Kampala Central, Uganda',
    country: 'UG',
    district: 'ug_kampala_central',
    city: 'Kampala',
    latitude: 0.3250,
    longitude: 32.6050,
    is_deleted: false,
    created_at: '2026-09-29T12:00:00Z',
    updated_at: '2026-09-29T12:00:00Z',
    likes_count: 132,
    like_count: 132,
    comments_count: 10,
    comment_count: 10,
    view_count: 710,
    share_count: 31,
    save_count: 49,
    trending_score: 52.4,
    trending_updated_at: '2026-09-29T13:00:00Z',
  },
];

const INITIAL_FOLLOWS: Follow[] = [
  { follower_id: 'user_coffee', following_id: 'user_ceramics', status: 'accepted', created_at: '2026-09-24T10:00:00Z' },
  { follower_id: 'user_coffee', following_id: 'user_bakery', status: 'accepted', created_at: '2026-09-24T11:00:00Z' },
  { follower_id: 'user_ceramics', following_id: 'user_coffee', status: 'accepted', created_at: '2026-09-24T12:00:00Z' },
  { follower_id: 'user_leather', following_id: 'user_coffee', status: 'accepted', created_at: '2026-09-25T08:00:00Z' },
  { follower_id: 'user_bakery', following_id: 'user_ceramics', status: 'accepted', created_at: '2026-09-25T09:00:00Z' },
];

const INITIAL_COMMENTS: Comment[] = [
  {
    id: 'comm_1',
    post_id: 'post_1',
    user_id: 'user_ceramics',
    parent_comment_id: null,
    body: 'We need to pair this washed Yirgacheffe with our new flat-white cups in the studio! Beautiful roast color @Bella Terra Roasters.',
    is_pinned: true,
    is_edited: false,
    created_at: '2026-09-28T02:10:00Z',
    likes_count: 8,
  },
  {
    id: 'comm_1_reply_1',
    post_id: 'post_1',
    user_id: 'user_coffee',
    parent_comment_id: 'comm_1',
    body: 'Absolutely! Bringing a fresh batch by the studio this Friday afternoon.',
    is_pinned: false,
    is_edited: false,
    created_at: '2026-09-28T02:30:00Z',
    likes_count: 3,
  },
  {
    id: 'comm_2',
    post_id: 'post_1',
    user_id: 'user_bakery',
    parent_comment_id: null,
    body: 'Saving a bag for our weekend sourdough tasting table. Drop some off if you can!',
    is_pinned: false,
    is_edited: false,
    created_at: '2026-09-28T02:45:00Z',
    likes_count: 4,
  },
  {
    id: 'comm_3',
    post_id: 'post_2',
    user_id: 'user_coffee',
    parent_comment_id: null,
    body: 'Those fluted curves are breathtaking @Nadia Studio Ceramics. Perfect vase silhouette.',
    is_pinned: true,
    is_edited: false,
    created_at: '2026-09-27T19:20:00Z',
    likes_count: 6,
  },
  {
    id: 'comm_4',
    post_id: 'post_2',
    user_id: 'user_leather',
    parent_comment_id: null,
    body: 'The wood ash glaze has an incredible earthy texture in person.',
    is_pinned: false,
    is_edited: false,
    created_at: '2026-09-27T20:00:00Z',
    likes_count: 2,
  },
  {
    id: 'comm_5',
    post_id: 'post_3',
    user_id: 'user_coffee',
    parent_comment_id: null,
    body: 'Nothing beats that sound fresh out of the hearth! Pair with an Americano.',
    is_pinned: false,
    is_edited: false,
    created_at: '2026-09-27T15:00:00Z',
    likes_count: 5,
  },
  {
    id: 'comm_6',
    post_id: 'post_4',
    user_id: 'user_ceramics',
    parent_comment_id: null,
    body: 'The stitch tension is immaculate. Heirloom quality craftsmanship.',
    is_pinned: false,
    is_edited: false,
    created_at: '2026-09-26T21:15:00Z',
    likes_count: 3,
  },
];

const INITIAL_COMMENT_LIKES: CommentLike[] = [
  { comment_id: 'comm_1', user_id: 'user_coffee', created_at: '2026-09-28T02:15:00Z' },
  { comment_id: 'comm_1', user_id: 'user_bakery', created_at: '2026-09-28T02:20:00Z' },
  { comment_id: 'comm_3', user_id: 'user_ceramics', created_at: '2026-09-27T19:25:00Z' },
];

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif_1',
    user_id: 'user_coffee',
    actor_id: 'user_ceramics',
    type: 'comment',
    target_id: 'post_1',
    title: 'New Comment',
    message: 'Nadia Studio Ceramics commented on your coffee roasting showcase.',
    is_read: false,
    created_at: '2026-09-28T02:10:00Z',
  },
  {
    id: 'notif_2',
    user_id: 'user_coffee',
    actor_id: 'user_ceramics',
    type: 'mention',
    target_id: 'post_1',
    title: 'Mentioned You',
    message: 'Nadia Studio Ceramics mentioned your business in a comment.',
    is_read: true,
    created_at: '2026-09-28T02:10:00Z',
  },
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'msg_1',
    sender_id: 'user_ceramics',
    recipient_id: 'user_coffee',
    content: 'Hi Marco! Are you open for a collaborative morning pop-up next Saturday? We could showcase our cups with your espresso bar.',
    is_read: true,
    created_at: '2026-09-27T10:15:00Z',
  },
  {
    id: 'msg_2',
    sender_id: 'user_coffee',
    recipient_id: 'user_ceramics',
    content: 'We would love that Nadia! Let me prepare 4 bags of the Yirgacheffe and our mobile grinder.',
    is_read: true,
    created_at: '2026-09-27T10:30:00Z',
  },
  {
    id: 'msg_3',
    sender_id: 'user_leather',
    recipient_id: 'user_coffee',
    content: 'Hello Bella Terra! Could we order 5 bespoke roasted gift boxes for our bespoke workshop clients?',
    is_read: false,
    created_at: '2026-09-27T16:00:00Z',
  },
];

const INITIAL_STAFF_ROLES: StaffRole[] = [
  {
    user_id: 'user_admin',
    role: 'admin',
    created_at: '2026-09-18T00:00:00Z',
  },
];

const INITIAL_VERIFICATION_REQUESTS: VerificationRequest[] = [
  {
    id: 'vreq_1',
    user_id: 'user_bakery',
    business_name: 'Levain & Crust Bakery',
    category: 'Bakery & Pastry',
    proof_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
    contact: 'order@levaincrust.com',
    notes: 'Commercial kitchen health inspection certificate and municipal bakery artisan trade license attached.',
    status: 'pending',
    created_at: '2026-09-26T12:00:00Z',
  },
  {
    id: 'vreq_2',
    user_id: 'user_leather',
    business_name: 'Sartoria Bespoke Goods',
    category: 'Leather & Tailoring',
    proof_url: 'https://images.unsplash.com/photo-1473187983305-f615340e7dd8?w=600&auto=format&fit=crop&q=80',
    contact: '+1 (555) 891-2300',
    notes: 'Guild certification of leathercraft and workshop lease registration.',
    status: 'pending',
    created_at: '2026-09-27T09:30:00Z',
  },
];

const INITIAL_LOGS: ActivityLog[] = [
  {
    id: 'log_01',
    user_id: 'user_coffee',
    action: 'signup',
    entity_type: 'profiles',
    entity_id: 'user_coffee',
    old_data: null,
    new_data: { business_name: 'Bella Terra Roasters', category: 'Coffee & Roasting' },
    created_at: '2026-09-20T08:00:00Z',
  },
  {
    id: 'log_02',
    user_id: 'user_coffee',
    action: 'post_created',
    entity_type: 'posts',
    entity_id: 'post_1',
    old_data: null,
    new_data: { media_type: 'image', caption: 'First batch of the morning: Ethiopian Yirgacheffe' },
    created_at: '2026-09-28T01:30:00Z',
  },
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx_01',
    reference_id: 'TXN-2026-1049',
    buyer_id: 'user_bakery',
    seller_id: 'user_coffee',
    item_type: 'craft_order',
    item_title: 'Ethiopian Yirgacheffe Washed - 5 lb Wholesale Batch',
    post_id: 'post_1',
    amount_cents: 9500, // $95.00
    fee_cents: 475,     // 5% platform fee ($4.75)
    payout_cents: 9025, // Net to artisan ($90.25)
    currency: 'USD',
    status: 'settled',
    payment_method: 'direct_transfer',
    notes: 'Standing weekly bakery espresso bean order.',
    created_at: '2026-09-27T10:00:00Z',
    settled_at: '2026-09-27T10:05:00Z',
    customer_email: 'order@levaincrust.com',
    shipping_address: '14 Rue Saint-Dominique, Paris, France',
  },
  {
    id: 'tx_02',
    reference_id: 'TXN-2026-1050',
    buyer_id: 'user_coffee',
    seller_id: 'user_ceramics',
    item_type: 'custom_commission',
    item_title: 'Hand-thrown Wood Ash Ceramic Espresso Cups (Set of 6)',
    post_id: 'post_2',
    amount_cents: 18000, // $180.00
    fee_cents: 900,
    payout_cents: 17100,
    currency: 'USD',
    status: 'settled',
    payment_method: 'apple_pay',
    notes: 'Custom unglazed rim, stamped with Bella Terra insignia.',
    created_at: '2026-09-28T09:15:00Z',
    settled_at: '2026-09-28T09:20:00Z',
    customer_email: 'marco@bellaterraroasters.com',
    shipping_address: '840 SE Water Ave, Portland, OR 97214',
  },
  {
    id: 'tx_03',
    reference_id: 'TXN-2026-1051',
    buyer_id: 'user_leather',
    seller_id: 'user_woodwork',
    item_type: 'craft_order',
    item_title: 'Reclaimed Oregon Walnut Leatherworking Cutting Slab',
    amount_cents: 24000, // $240.00
    fee_cents: 1200,
    payout_cents: 22800,
    currency: 'USD',
    status: 'settled',
    payment_method: 'credit_card',
    notes: 'Beeswax and mineral oil food-safe finish.',
    created_at: '2026-09-28T14:30:00Z',
    settled_at: '2026-09-28T14:35:00Z',
    customer_email: 'atelier@sartoriabespoke.com',
  },
  {
    id: 'tx_04',
    reference_id: 'TXN-2026-1052',
    buyer_id: 'user_flora',
    seller_id: 'user_coffee',
    item_type: 'workshop_ticket',
    item_title: 'Home Barista Masterclass & Sensory Cupping (2 Seats)',
    post_id: 'post_coffee_2',
    amount_cents: 12000, // $120.00
    fee_cents: 600,
    payout_cents: 11400,
    currency: 'USD',
    status: 'settled',
    payment_method: 'credit_card',
    notes: 'Saturday 10am cupping session.',
    created_at: '2026-09-29T11:00:00Z',
    settled_at: '2026-09-29T11:02:00Z',
    customer_email: 'claire@urbanmeadowflora.com',
  },
  {
    id: 'tx_05',
    reference_id: 'TXN-2026-1053',
    buyer_id: 'user_coffee',
    seller_id: 'user_leather',
    item_type: 'craft_order',
    item_title: 'Full-Grain Vegetable Tanned Barista Apron with Brass Rings',
    amount_cents: 16500, // $165.00
    fee_cents: 825,
    payout_cents: 15675,
    currency: 'USD',
    status: 'pending',
    payment_method: 'credit_card',
    notes: 'Awaiting bespoke stitching completion.',
    created_at: '2026-09-30T16:20:00Z',
    customer_email: 'marco@bellaterraroasters.com',
  },
  {
    id: 'tx_06',
    reference_id: 'TXN-2026-1054',
    buyer_id: 'user_woodwork',
    seller_id: 'user_bakery',
    item_type: 'booth_sale',
    item_title: 'Artisan Farmers Market Breakfast Pastry Box & 2 Sourdough Loaves',
    amount_cents: 4800, // $48.00
    fee_cents: 240,
    payout_cents: 4560,
    currency: 'USD',
    status: 'settled',
    payment_method: 'market_cash',
    notes: 'Weekend marketplace booth purchase.',
    created_at: '2026-10-01T08:45:00Z',
    settled_at: '2026-10-01T08:45:00Z',
  },
  {
    id: 'tx_07',
    reference_id: 'TXN-2026-1055',
    buyer_id: 'user_flora',
    seller_id: 'user_ceramics',
    item_type: 'custom_commission',
    item_title: 'Fluted Botanical Stoneware Planter Pots (3 Sizes)',
    amount_cents: 21000, // $210.00
    fee_cents: 1050,
    payout_cents: 19950,
    currency: 'USD',
    status: 'pending',
    payment_method: 'direct_transfer',
    notes: 'Custom drainage hole and matching saucers.',
    created_at: '2026-10-01T15:10:00Z',
    customer_email: 'claire@urbanmeadowflora.com',
  },
  {
    id: 'tx_08',
    reference_id: 'TXN-2026-1056',
    buyer_id: 'user_bakery',
    seller_id: 'user_flora',
    item_type: 'craft_order',
    item_title: 'Edible Organic Flower Blossom Box for Pastry Finishing',
    amount_cents: 6500, // $65.00
    fee_cents: 325,
    payout_cents: 6175,
    currency: 'USD',
    status: 'refunded',
    payment_method: 'apple_pay',
    notes: 'Delivered in transit during extreme heat. Full refund issued by administrator.',
    created_at: '2026-09-25T13:00:00Z',
    settled_at: '2026-09-25T13:05:00Z',
    refunded_at: '2026-09-26T09:30:00Z',
    customer_email: 'order@levaincrust.com',
  },
  {
    id: 'tx_09',
    reference_id: 'TXN-2026-1057',
    buyer_id: 'user_ceramics',
    seller_id: 'user_leather',
    item_type: 'craft_order',
    item_title: 'Bespoke Tool Roll for Pottery Carving & Trimming Ribs',
    amount_cents: 11500, // $115.00
    fee_cents: 575,
    payout_cents: 10925,
    currency: 'USD',
    status: 'disputed',
    payment_method: 'credit_card',
    notes: 'Customer reported pocket dimension mismatch with carving tools.',
    dispute_reason: 'Pocket slot width variance exceeds bespoke tolerances.',
    created_at: '2026-09-29T18:00:00Z',
    disputed_at: '2026-09-30T10:00:00Z',
    customer_email: 'hello@nadiastudio.craft',
  },
  {
    id: 'tx_10',
    reference_id: 'TXN-2026-1058',
    buyer_id: 'user_coffee',
    seller_id: 'user_woodwork',
    item_type: 'patronage_tip',
    item_title: 'Patronage Support: Heritage Cedar Tree Planting Project',
    amount_cents: 5000, // $50.00
    fee_cents: 250,
    payout_cents: 4750,
    currency: 'USD',
    status: 'settled',
    payment_method: 'apple_pay',
    notes: 'Direct workshop sponsorship.',
    created_at: '2026-10-02T02:00:00Z',
    settled_at: '2026-10-02T02:01:00Z',
    customer_email: 'marco@bellaterraroasters.com',
  },
];

const INITIAL_TRANSACTION_AUDIT_LOGS: TransactionAuditLog[] = [
  {
    id: 'tx_log_1',
    transaction_id: 'tx_01',
    reference_id: 'TXN-2026-1049',
    admin_id: 'user_admin',
    admin_name: 'Amapati Guild Trust Administrator',
    action: 'settled',
    previous_status: 'pending',
    new_status: 'settled',
    amount_affected_cents: 9500,
    reason: 'Delivery confirmed and automatic payout released to Bella Terra Roasters.',
    created_at: '2026-09-27T10:05:00Z',
  },
  {
    id: 'tx_log_2',
    transaction_id: 'tx_08',
    reference_id: 'TXN-2026-1056',
    admin_id: 'user_admin',
    admin_name: 'Amapati Guild Trust Administrator',
    action: 'refunded',
    previous_status: 'settled',
    new_status: 'refunded',
    amount_affected_cents: 6500,
    reason: 'Heat damage claim accepted. Full $65.00 refunded to buyer.',
    created_at: '2026-09-26T09:30:00Z',
  },
  {
    id: 'tx_log_3',
    transaction_id: 'tx_09',
    reference_id: 'TXN-2026-1057',
    admin_id: 'user_admin',
    admin_name: 'Amapati Guild Trust Administrator',
    action: 'disputed',
    previous_status: 'pending',
    new_status: 'disputed',
    amount_affected_cents: 11500,
    reason: 'Buyer opened dispute regarding custom carving tool pocket dimensions.',
    created_at: '2026-09-30T10:00:00Z',
  },
];

const INITIAL_REVIEWS: BusinessReview[] = [
  {
    id: 'rev_01',
    business_id: 'user_endiro',
    user_id: 'user_coffee',
    author_name: 'Bella Terra Roasters',
    author_avatar: '/src/assets/images/coffee_roaster_1790587302699.jpg',
    rating: 5,
    title: 'Flawless single-origin Mt. Elgon Bukonzo Arabica!',
    comment: 'Stopped by their Kololo leafy garden deck and ordered the Chemex pour-over. Outstanding clarity with notes of blackcurrant, raw cane sugar, and citrus zest. A true model of ethical tree-to-cup coffee supporting women farmers.',
    tags: ['Single-origin Bugisu', 'Flawless Chemex pour', 'Cozy garden patio'],
    helpful_votes: 14,
    helpful_user_ids: ['user_ceramics', 'user_thelawns'],
    is_verified_patron: true,
    visit_date: 'September 2026',
    created_at: '2026-09-29T12:00:00Z',
  },
  {
    id: 'rev_02',
    business_id: 'user_thelawns',
    user_id: 'user_bakery',
    author_name: 'Levain & Crust Bakery',
    author_avatar: '/src/assets/images/bakery_pastry_1790587333429.jpg',
    rating: 5,
    title: 'The acacia canopy dinner was pure magic',
    comment: 'The whole grilled Lake Victoria tilapia marinated in lemongrass and local chili was cooked to perfection. Crispy sweet plantains on the side. The romantic garden ambiance in Kololo is world class.',
    tags: ['Fresh Lake Victoria Tilapia', 'Lush acacia garden', 'Sweet plantain crisps'],
    helpful_votes: 19,
    helpful_user_ids: ['user_endiro', 'user_coffee'],
    is_verified_patron: true,
    visit_date: 'September 2026',
    created_at: '2026-09-29T14:30:00Z',
  },
  {
    id: 'rev_03',
    business_id: 'user_events_kampala',
    user_id: 'user_leather',
    author_name: 'Sartoria Bespoke Goods',
    author_avatar: '/src/assets/images/leather_tailor_1790587348791.jpg',
    rating: 5,
    title: 'Unbeatable Saturday afternoon energy in Bugolobi',
    comment: 'The acoustic Kora set paired with vinyl DJ selections was transcendent. We had a booth showcasing our leather craft and the community response was sensational. Can not wait for next month!',
    tags: ['Vibrant weekend energy', 'Curated vinyl selectors', 'Live acoustic Kora'],
    helpful_votes: 22,
    helpful_user_ids: ['user_designhub', 'user_32east'],
    is_verified_patron: true,
    visit_date: 'September 2026',
    created_at: '2026-09-29T16:00:00Z',
  },
  {
    id: 'rev_04',
    business_id: 'user_designhub',
    user_id: 'user_ceramics',
    author_name: 'Nadia Studio Ceramics',
    author_avatar: '/src/assets/images/ceramic_studio_1790587319737.jpg',
    rating: 5,
    title: 'An inspiring creative industrial haven in Kampala',
    comment: 'Design Hub Bugolobi is the creative heartbeat of the city. Loved seeing the bark cloth artisans, prototype makers, and open terrace discussions. Great cold brew and friendly maker community.',
    tags: ['Creative community', 'Inspiring open studios', 'Great artisan workshops'],
    helpful_votes: 11,
    helpful_user_ids: ['user_events_kampala'],
    is_verified_patron: true,
    visit_date: 'September 2026',
    created_at: '2026-09-28T18:00:00Z',
  },
  {
    id: 'rev_05',
    business_id: 'user_1000cups',
    user_id: 'user_coffee',
    author_name: 'Bella Terra Roasters',
    author_avatar: '/src/assets/images/coffee_roaster_1790587302699.jpg',
    rating: 5,
    title: 'Historic Nakasero coffee shrine with authentic clay pots',
    comment: 'Traditional clay pot coffee brewed with ginger and cardamom pods right in front of you. 20 years of championing Ugandan coffee farmers shines through every pour.',
    tags: ['Single-origin Bugisu', 'Rich crema', 'Authentic craft'],
    helpful_votes: 16,
    helpful_user_ids: ['user_endiro'],
    is_verified_patron: true,
    visit_date: 'September 2026',
    created_at: '2026-09-28T11:00:00Z',
  },
  {
    id: 'rev_06',
    business_id: 'user_32east',
    user_id: 'user_ceramics',
    author_name: 'Nadia Studio Ceramics',
    author_avatar: '/src/assets/images/ceramic_studio_1790587319737.jpg',
    rating: 5,
    title: 'Peaceful contemporary art and clay workshop sanctuary',
    comment: 'The view over Lake Victoria from Muyenga Tank Hill combined with open-air clay sculpting sessions is truly therapeutic. A priceless community art space.',
    tags: ['Lake Victoria breeze', 'Peaceful courtyard', 'Great artisan workshops'],
    helpful_votes: 8,
    helpful_user_ids: ['user_designhub'],
    is_verified_patron: true,
    visit_date: 'September 2026',
    created_at: '2026-09-27T19:00:00Z',
  },
  {
    id: 'rev_07',
    business_id: 'user_cafejavas',
    user_id: 'user_thelawns',
    author_name: 'The Lawns Restaurant & Lounge',
    author_avatar: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&auto=format&fit=crop&q=80',
    rating: 5,
    title: 'Legendary brunch and signature iced mocha',
    comment: 'Consistent excellence at Lugogo. Fast table service, generous breakfast skillets, and their signature mocha caramel crunch is always a hit.',
    tags: ['Attentive service', 'Flavorful marinades'],
    helpful_votes: 15,
    helpful_user_ids: ['user_endiro'],
    is_verified_patron: true,
    visit_date: 'September 2026',
    created_at: '2026-09-29T15:00:00Z',
  },
];

const INITIAL_SURVEYS: FeedbackSurvey[] = [
  {
    id: 'survey_endiro',
    business_id: 'user_endiro',
    question: 'Which new single-origin coffee roast should we feature on the Kololo brew bar next month?',
    category: 'Future Product Drop',
    options: [
      { id: 'opt_1', text: 'Rwenzori Mountain Natural (Strawberry & Cacao)', votes: 28 },
      { id: 'opt_2', text: 'Bugisu Peaberry Honey Process (Brown Sugar & Lime)', votes: 21 },
      { id: 'opt_3', text: 'Zombo Arabica Washed (Jasmine & Bergamot)', votes: 14 },
    ],
    total_votes: 63,
    voter_user_ids: { user_coffee: 'opt_1', user_bakery: 'opt_2' },
    is_active: true,
    created_at: '2026-09-30T10:00:00Z',
  },
  {
    id: 'survey_thelawns',
    business_id: 'user_thelawns',
    question: 'What new seasonal dining creation would you like to see under the garden acacia canopy?',
    category: 'New Menu Concept',
    options: [
      { id: 'opt_1', text: 'Whole Grilled Tilapia with Ginger Tamarind Glaze', votes: 34 },
      { id: 'opt_2', text: 'Slow-Smoked Kigezi Ribs with Sweet Plantain Mash', votes: 29 },
      { id: 'opt_3', text: 'Wood-Fired Garden Flatbread with Nile Herbs', votes: 16 },
    ],
    total_votes: 79,
    voter_user_ids: {},
    is_active: true,
    created_at: '2026-09-29T14:00:00Z',
  },
  {
    id: 'survey_designhub',
    business_id: 'user_designhub',
    question: 'Which artisan craft masterclass should we schedule for the next Bugolobi weekend session?',
    category: 'Patron Workshop',
    options: [
      { id: 'opt_1', text: 'Hand-thrown Stoneware Pottery & Wheel Technique', votes: 44 },
      { id: 'opt_2', text: 'Traditional Bark Cloth Textile & Pattern Dyeing', votes: 27 },
      { id: 'opt_3', text: 'Specialty Espresso Cupping & Sensory Workshop', votes: 19 },
    ],
    total_votes: 90,
    voter_user_ids: {},
    is_active: true,
    created_at: '2026-09-28T09:00:00Z',
  },
  {
    id: 'survey_1000cups',
    business_id: 'user_1000cups',
    question: 'What traditional spice infusion should we pair with our Nakasero clay pot brew?',
    category: 'Artisan Experiment',
    options: [
      { id: 'opt_1', text: 'Spiced Ginger Root & Cardamom Pods', votes: 38 },
      { id: 'opt_2', text: 'Wild Forest Honey & Clove', votes: 22 },
      { id: 'opt_3', text: 'Pure Single-Origin Unspiced Bugisu', votes: 17 },
    ],
    total_votes: 77,
    voter_user_ids: {},
    is_active: true,
    created_at: '2026-09-28T11:00:00Z',
  },
];

export class LocalDatabase {
  private state: DatabaseState;

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): DatabaseState {
    if (typeof window === 'undefined') {
      return {
        profiles: INITIAL_PROFILES,
        posts: INITIAL_POSTS,
        postViews: [],
        follows: INITIAL_FOLLOWS,
        blocks: [],
        reports: [],
        comments: INITIAL_COMMENTS,
        commentLikes: INITIAL_COMMENT_LIKES,
        notifications: INITIAL_NOTIFICATIONS,
        messages: INITIAL_MESSAGES,
        staffRoles: INITIAL_STAFF_ROLES,
        verificationRequests: INITIAL_VERIFICATION_REQUESTS,
        activityLogs: INITIAL_LOGS,
        retentionPolicies: INITIAL_RETENTION_POLICIES,
        transactions: INITIAL_TRANSACTIONS,
        transactionAuditLogs: INITIAL_TRANSACTION_AUDIT_LOGS,
        reviews: INITIAL_REVIEWS,
        surveys: INITIAL_SURVEYS,
        onboardingTours: [],
      };
    }

    try {
      const raw = localStorage.getItem(DB_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          profiles: parsed.profiles || INITIAL_PROFILES,
          posts: parsed.posts && parsed.posts.length >= INITIAL_POSTS.length ? parsed.posts : INITIAL_POSTS,
          postViews: parsed.postViews || [],
          follows: parsed.follows || INITIAL_FOLLOWS,
          blocks: parsed.blocks || [],
          reports: parsed.reports || [],
          comments: parsed.comments || INITIAL_COMMENTS,
          commentLikes: parsed.commentLikes || INITIAL_COMMENT_LIKES,
          notifications: parsed.notifications || INITIAL_NOTIFICATIONS,
          messages: parsed.messages || INITIAL_MESSAGES,
          staffRoles: parsed.staffRoles || INITIAL_STAFF_ROLES,
          verificationRequests: parsed.verificationRequests || INITIAL_VERIFICATION_REQUESTS,
          activityLogs: parsed.activityLogs || INITIAL_LOGS,
          retentionPolicies: parsed.retentionPolicies || INITIAL_RETENTION_POLICIES,
          transactions:
            parsed.transactions && parsed.transactions.length > 0
              ? parsed.transactions
              : INITIAL_TRANSACTIONS,
          transactionAuditLogs:
            parsed.transactionAuditLogs && parsed.transactionAuditLogs.length > 0
              ? parsed.transactionAuditLogs
              : INITIAL_TRANSACTION_AUDIT_LOGS,
          reviews:
            parsed.reviews && parsed.reviews.length > 0
              ? parsed.reviews
              : INITIAL_REVIEWS,
          surveys:
            parsed.surveys && parsed.surveys.length > 0
              ? parsed.surveys
              : INITIAL_SURVEYS,
          onboardingTours: parsed.onboardingTours || [],
        };
      }
    } catch (e) {
      console.warn('Failed to parse stored local database:', e);
    }

    const initial: DatabaseState = {
      profiles: INITIAL_PROFILES,
      posts: INITIAL_POSTS,
      postViews: [],
      follows: INITIAL_FOLLOWS,
      blocks: [],
      reports: [],
      comments: INITIAL_COMMENTS,
      commentLikes: INITIAL_COMMENT_LIKES,
      notifications: INITIAL_NOTIFICATIONS,
      messages: INITIAL_MESSAGES,
      staffRoles: INITIAL_STAFF_ROLES,
      verificationRequests: INITIAL_VERIFICATION_REQUESTS,
      activityLogs: INITIAL_LOGS,
      retentionPolicies: INITIAL_RETENTION_POLICIES,
      transactions: INITIAL_TRANSACTIONS,
      transactionAuditLogs: INITIAL_TRANSACTION_AUDIT_LOGS,
      reviews: INITIAL_REVIEWS,
      surveys: INITIAL_SURVEYS,
      onboardingTours: [],
    };
    this.saveState(initial);
    return initial;
  }

  private saveState(state: DatabaseState) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        console.warn('Failed to save local database to localStorage:', e);
      }
    }
  }

  public resetToDefault() {
    this.state = {
      profiles: [...INITIAL_PROFILES],
      posts: [...INITIAL_POSTS],
      postViews: [],
      follows: [...INITIAL_FOLLOWS],
      blocks: [],
      reports: [],
      comments: [...INITIAL_COMMENTS],
      commentLikes: [...INITIAL_COMMENT_LIKES],
      notifications: [...INITIAL_NOTIFICATIONS],
      messages: [...INITIAL_MESSAGES],
      staffRoles: [...INITIAL_STAFF_ROLES],
      verificationRequests: [...INITIAL_VERIFICATION_REQUESTS],
      activityLogs: [...INITIAL_LOGS],
      retentionPolicies: [...INITIAL_RETENTION_POLICIES],
      transactions: [...INITIAL_TRANSACTIONS],
      transactionAuditLogs: [...INITIAL_TRANSACTION_AUDIT_LOGS],
      reviews: [...INITIAL_REVIEWS],
      surveys: [...INITIAL_SURVEYS],
      onboardingTours: [],
    };
    this.saveState(this.state);
  }

  // --- APPEND-ONLY ACTIVITY LOG ---
  private logActivity(
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    oldData: Record<string, any> | null = null,
    newData: Record<string, any> | null = null
  ) {
    const entry: ActivityLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      old_data: oldData,
      new_data: newData,
      created_at: new Date().toISOString(),
    };
    this.state.activityLogs.unshift(entry);
    this.saveState(this.state);
  }

  // --- PROFILES ---
  public getProfile(id: string, viewerId?: string): Profile | null {
    const profile = this.state.profiles.find((p) => p.id === id);
    if (!profile) return null;

    const followers = this.state.follows.filter((f) => f.following_id === id && f.status === 'accepted').length;
    const following = this.state.follows.filter((f) => f.follower_id === id && f.status === 'accepted').length;
    const postCount = this.state.posts.filter((p) => p.user_id === id && !p.is_deleted).length;

    const bReviews = (this.state.reviews || []).filter((r) => r.business_id === id);
    const reviewCount = bReviews.length;
    const avgRating = reviewCount > 0
      ? Math.round((bReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount) * 10) / 10
      : 5.0;

    let isFollowing = false;
    let followStatus: FollowStatus = 'none';
    if (viewerId) {
      const follow = this.state.follows.find(
        (f) => f.follower_id === viewerId && f.following_id === id
      );
      isFollowing = follow?.status === 'accepted';
      followStatus = follow ? follow.status : 'none';
    }

    return {
      ...profile,
      followers_count: followers,
      following_count: following,
      posts_count: postCount,
      rating: reviewCount > 0 ? avgRating : (profile.rating || 5.0),
      review_count: reviewCount > 0 ? reviewCount : (profile.review_count || 0),
      is_following: isFollowing,
      follow_status: followStatus,
    };
  }

  public getAllProfiles(currentUserId?: string): Profile[] {
    const blockedIds = currentUserId
      ? this.state.blocks
          .filter((b) => b.blocker_id === currentUserId || b.blocked_id === currentUserId)
          .map((b) => (b.blocker_id === currentUserId ? b.blocked_id : b.blocker_id))
      : [];

    return this.state.profiles
      .filter((p) => !blockedIds.includes(p.id))
      .map((p) => this.getProfile(p.id, currentUserId)!);
  }

  public getFollowers(userId: string, viewerId?: string): Profile[] {
    const ids = this.state.follows
      .filter((f) => f.following_id === userId && f.status === 'accepted')
      .map((f) => f.follower_id);
    return ids.map((id) => this.getProfile(id, viewerId)).filter((p): p is Profile => Boolean(p));
  }

  public getFollowing(userId: string, viewerId?: string): Profile[] {
    const ids = this.state.follows
      .filter((f) => f.follower_id === userId && f.status === 'accepted')
      .map((f) => f.following_id);
    return ids.map((id) => this.getProfile(id, viewerId)).filter((p): p is Profile => Boolean(p));
  }

  public getFollowRequests(userId: string): Profile[] {
    const ids = this.state.follows
      .filter((f) => f.following_id === userId && f.status === 'pending')
      .map((f) => f.follower_id);
    return ids.map((id) => this.getProfile(id)).filter((p): p is Profile => Boolean(p));
  }

  public approveFollowRequest(followingId: string, followerId: string): boolean {
    const follow = this.state.follows.find(
      (f) => f.following_id === followingId && f.follower_id === followerId && f.status === 'pending'
    );
    if (!follow) return false;
    follow.status = 'accepted';
    this.saveState(this.state);
    return true;
  }

  public createOrUpdateProfile(profile: Partial<Profile> & { id: string }): Profile {
    const existingIndex = this.state.profiles.findIndex((p) => p.id === profile.id);
    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      const oldProfile = this.state.profiles[existingIndex];
      const updatedProfile: Profile = {
        ...oldProfile,
        ...profile,
        updated_at: now,
      };
      this.state.profiles[existingIndex] = updatedProfile;
      this.saveState(this.state);
      this.logActivity(profile.id, 'profile_updated', 'profiles', profile.id, oldProfile, updatedProfile);
      return this.getProfile(profile.id)!;
    } else {
      const newProfile: Profile = {
        id: profile.id,
        business_name: profile.business_name || 'Artisan Workshop',
        bio: profile.bio || '',
        category: profile.category || 'General Business',
        contact: profile.contact || '',
        avatar_url: profile.avatar_url || '/src/assets/images/coffee_roaster_1790587302699.jpg',
        is_private: profile.is_private || false,
        is_verified: false,
        created_at: now,
        updated_at: now,
      };
      this.state.profiles.push(newProfile);
      this.saveState(this.state);
      this.logActivity(profile.id, 'signup', 'profiles', profile.id, null, newProfile);
      return this.getProfile(profile.id)!;
    }
  }

  public searchProfiles(
    query?: string,
    options?: {
      category?: string;
      location?: string;
      nearLat?: number;
      nearLng?: number;
      radiusKm?: number;
      verifiedOnly?: boolean;
    }
  ): Profile[] {
    let list = [...this.state.profiles];
    if (query && query.trim()) {
      const q = query.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.business_name.toLowerCase().includes(q) ||
          p.bio.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.location && p.location.toLowerCase().includes(q))
      );
    }
    if (options?.category && options.category !== 'all') {
      const cat = options.category.toLowerCase();
      list = list.filter((p) => p.category.toLowerCase().includes(cat));
    }
    if (options?.location && options.location !== 'all') {
      const loc = options.location.toLowerCase();
      list = list.filter((p) => p.location && p.location.toLowerCase().includes(loc));
    }
    if (options?.verifiedOnly) {
      list = list.filter((p) => p.is_verified);
    }
    return list;
  }

  // --- POSTS ---
  public recomputeTrendingScores(): { updated_count: number } {
    const now = Date.now();
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    let count = 0;

    for (const post of this.state.posts) {
      if (post.is_deleted) {
        post.trending_score = 0;
        continue;
      }

      const postCreatedTime = new Date(post.created_at).getTime();
      const postAgeMs = Math.max(0, now - postCreatedTime);
      const hoursSinceCreated = postAgeMs / (3600 * 1000);

      // Posts older than 7 days are excluded from Discover's trending sort entirely
      if (postAgeMs > SEVEN_DAYS_MS) {
        post.trending_score = 0;
        continue;
      }

      // Views in the last 24h
      const viewsLast24h = this.state.postViews.filter(
        (pv) => pv.post_id === post.id && now - new Date(pv.created_at).getTime() <= TWENTY_FOUR_HOURS_MS
      ).length;

      // Effective velocity engagement
      const effectiveLikes = post.like_count ?? post.likes_count ?? 0;
      const commentsLast24h = this.state.comments.filter(
        (c) => c.post_id === post.id && !c.deleted_at && now - new Date(c.created_at).getTime() <= TWENTY_FOUR_HOURS_MS
      ).length;
      const effectiveComments = commentsLast24h > 0 ? commentsLast24h : (post.comment_count ?? post.comments_count ?? 0);
      const effectiveShares = post.share_count || 0;
      const effectiveSaves = post.save_count || 0;

      // Numerator: Activity velocity within last 24h
      // (views_last_24h * 1 + likes_last_24h * 3 + comments_last_24h * 5 + shares_last_24h * 8 + saves_last_24h * 4)
      const numerator =
        (viewsLast24h * 1) +
        (effectiveLikes * 3) +
        (effectiveComments * 5) +
        (effectiveShares * 8) +
        (effectiveSaves * 4);

      // Denominator: power(hours_since_created + 2, 1.5)
      const denominator = Math.pow(hoursSinceCreated + 2, 1.5);
      let score = numerator / denominator;

      // Fresh boost: posts younger than 2 hours receive a flat minimum score
      if (hoursSinceCreated < 2.0) {
        score = Math.max(score, 8.5);
      }

      post.trending_score = Math.round(score * 1000) / 1000;
      post.trending_updated_at = new Date().toISOString();
      count++;
    }

    this.saveState(this.state);
    return { updated_count: count };
  }

  public recordView(postId: string, viewerId?: string | null): { recorded: boolean; deduped: boolean } {
    const post = this.state.posts.find((p) => p.id === postId);
    if (!post) return { recorded: false, deduped: false };

    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
    const now = Date.now();
    const effectiveViewerId = viewerId || 'anon';

    // Deduplication check: 1 row per (post_id, viewer_id) per rolling 24h period
    const existing = this.state.postViews.find(
      (pv) =>
        pv.post_id === postId &&
        (pv.viewer_id || 'anon') === effectiveViewerId &&
        now - new Date(pv.created_at).getTime() < TWENTY_FOUR_HOURS_MS
    );

    if (existing) {
      return { recorded: false, deduped: true };
    }

    const newView: PostView = {
      id: 'view_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      post_id: postId,
      viewer_id: viewerId || null,
      created_at: new Date().toISOString(),
    };

    this.state.postViews.push(newView);
    post.view_count = (post.view_count || 0) + 1;
    this.saveState(this.state);
    return { recorded: true, deduped: false };
  }

  public recordViewsBatch(postIds: string[], viewerId?: string | null): number {
    let count = 0;
    for (const id of postIds) {
      const res = this.recordView(id, viewerId);
      if (res.recorded) count++;
    }
    return count;
  }

  public getPosts(options: {
    viewerId?: string;
    userId?: string;
    feedType?: 'following' | 'discover';
    category?: string;
    searchQuery?: string;
    country?: string;
    district?: string;
    userCoords?: GeoLocationCoords | null;
    maxDistanceKm?: number;
    sort?: 'latest' | 'popular' | 'trending' | 'distance';
  } = {}): Post[] {
    const {
      viewerId,
      userId,
      feedType = 'following',
      category,
      searchQuery,
      country,
      district,
      userCoords,
      maxDistanceKm,
      sort,
    } = options;

    const blockedIds = viewerId
      ? this.state.blocks
          .filter((b) => b.blocker_id === viewerId || b.blocked_id === viewerId)
          .map((b) => (b.blocker_id === viewerId ? b.blocked_id : b.blocker_id))
      : [];

    let filtered = this.state.posts.filter((p) => !p.is_deleted && !blockedIds.includes(p.user_id));

    if (userId) {
      filtered = filtered.filter((p) => p.user_id === userId);
    }

    if (feedType === 'following' && viewerId && !userId) {
      const followingIds = this.state.follows
        .filter((f) => f.follower_id === viewerId && f.status === 'accepted')
        .map((f) => f.following_id);
      filtered = filtered.filter((p) => followingIds.includes(p.user_id) || p.user_id === viewerId);
    }

    // Country Filter
    if (country && country !== 'all') {
      filtered = filtered.filter((p) => {
        const author = this.state.profiles.find((pr) => pr.id === p.user_id);
        const pCountry = p.country || author?.country;
        return pCountry?.toLowerCase() === country.toLowerCase();
      });
    }

    // District Filter
    if (district && district !== 'all' && !district.endsWith('_all')) {
      filtered = filtered.filter((p) => {
        const author = this.state.profiles.find((pr) => pr.id === p.user_id);
        const pDistrict = p.district || author?.district;
        return pDistrict === district;
      });
    }

    // Category Filter
    if (category && category !== 'all') {
      const categoryProfiles = this.state.profiles
        .filter((pr) => pr.category.toLowerCase().includes(category.toLowerCase()))
        .map((pr) => pr.id);
      filtered = filtered.filter((p) => categoryProfiles.includes(p.user_id));
    }

    // Search Query (matches caption, author, category, location, city, district)
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((p) => {
        const author = this.state.profiles.find((pr) => pr.id === p.user_id);
        return (
          p.caption.toLowerCase().includes(q) ||
          author?.business_name.toLowerCase().includes(q) ||
          author?.category.toLowerCase().includes(q) ||
          (author?.location && author.location.toLowerCase().includes(q)) ||
          (author?.city && author.city.toLowerCase().includes(q)) ||
          (author?.district && author.district.toLowerCase().includes(q)) ||
          (p.location && p.location.toLowerCase().includes(q)) ||
          (p.city && p.city.toLowerCase().includes(q)) ||
          (p.district && p.district.toLowerCase().includes(q))
        );
      });
    }

    // Geolocation Distance Calculation
    if (userCoords) {
      filtered = filtered.map((p) => {
        const author = this.state.profiles.find((pr) => pr.id === p.user_id);
        const lat = p.latitude ?? author?.latitude;
        const lon = p.longitude ?? author?.longitude;
        const dist = calculateDistanceKm(userCoords.latitude, userCoords.longitude, lat, lon);
        return {
          ...p,
          distance_km: dist !== null ? dist : undefined,
        };
      });

      if (maxDistanceKm && maxDistanceKm > 0) {
        filtered = filtered.filter((p) => p.distance_km === undefined || p.distance_km <= maxDistanceKm);
      }
    }

    // DISCOVER FEED RANKING & SORTING
    if (sort === 'distance' && userCoords) {
      filtered.sort((a, b) => (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity));
    } else if (feedType === 'discover' && !userId && sort !== 'latest') {
      // Recompute trending scores on fresh load
      this.recomputeTrendingScores();

      const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
      const now = Date.now();
      // Exclude posts older than 7 days from Discover's trending sort entirely
      filtered = filtered.filter((p) => now - new Date(p.created_at).getTime() <= SEVEN_DAYS_MS);

      // Sort by trending_score descending, then created_at
      filtered.sort((a, b) => {
        const diff = (b.trending_score || 0) - (a.trending_score || 0);
        if (Math.abs(diff) > 0.001) return diff;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      // Diversity Rule: "no single account may occupy more than 2 of the top 20 Discover slots in one query"
      const diverseSlots: Post[] = [];
      const deferredSlots: Post[] = [];
      const authorSlotCount: Record<string, number> = {};

      for (const p of filtered) {
        const count = authorSlotCount[p.user_id] || 0;
        if (count < 2) {
          diverseSlots.push(p);
          authorSlotCount[p.user_id] = count + 1;
        } else {
          deferredSlots.push(p);
        }
      }

      if (diverseSlots.length >= 20) {
        filtered = [...diverseSlots.slice(0, 20), ...deferredSlots, ...diverseSlots.slice(20)];
      } else {
        filtered = diverseSlots;
      }
    } else if (sort === 'popular') {
      // Popular sort option on profile grids: sort by lifetime like_count + comment_count
      filtered.sort((a, b) => {
        const popA = (a.like_count ?? a.likes_count ?? 0) + (a.comment_count ?? a.comments_count ?? 0);
        const popB = (b.like_count ?? b.likes_count ?? 0) + (b.comment_count ?? b.comments_count ?? 0);
        if (popB !== popA) return popB - popA;
        return (b.view_count || 0) - (a.view_count || 0);
      });
    } else {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return filtered.map((post) => {
      const author = this.getProfile(post.user_id, viewerId);
      const commentsCount = this.state.comments.filter((c) => c.post_id === post.id && !c.deleted_at).length;
      let postAuthor = author || undefined;
      if (postAuthor && userCoords) {
        const authorDist = calculateDistanceKm(
          userCoords.latitude,
          userCoords.longitude,
          postAuthor.latitude,
          postAuthor.longitude
        );
        postAuthor = {
          ...postAuthor,
          distance_km: authorDist !== null ? authorDist : undefined,
        };
      }
      return {
        ...post,
        like_count: post.like_count ?? post.likes_count ?? 0,
        comment_count: commentsCount,
        comments_count: commentsCount,
        view_count: post.view_count || 0,
        share_count: post.share_count || 0,
        save_count: post.save_count || 0,
        trending_score: post.trending_score || 0,
        user: postAuthor,
      };
    });
  }

  public getBusinesses(options: {
    currentUserId?: string;
    country?: string;
    district?: string;
    category?: string;
    searchQuery?: string;
    userCoords?: GeoLocationCoords | null;
    maxDistanceKm?: number;
    sort?: 'distance' | 'trending' | 'name' | 'verified';
  } = {}): Profile[] {
    const {
      currentUserId,
      country,
      district,
      category,
      searchQuery,
      userCoords,
      maxDistanceKm,
      sort = 'trending',
    } = options;

    let profiles = this.getAllProfiles(currentUserId);

    if (country && country !== 'all') {
      profiles = profiles.filter((p) => p.country?.toLowerCase() === country.toLowerCase());
    }

    if (district && district !== 'all' && !district.endsWith('_all')) {
      profiles = profiles.filter((p) => p.district === district);
    }

    if (category && category !== 'all') {
      profiles = profiles.filter((p) => p.category.toLowerCase().includes(category.toLowerCase()));
    }

    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      profiles = profiles.filter((p) =>
        p.business_name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.bio.toLowerCase().includes(q) ||
        (p.location && p.location.toLowerCase().includes(q)) ||
        (p.city && p.city.toLowerCase().includes(q)) ||
        (p.district && p.district.toLowerCase().includes(q))
      );
    }

    if (userCoords) {
      profiles = profiles.map((p) => {
        const dist = calculateDistanceKm(userCoords.latitude, userCoords.longitude, p.latitude, p.longitude);
        return {
          ...p,
          distance_km: dist !== null ? dist : undefined,
        };
      });

      if (maxDistanceKm && maxDistanceKm > 0) {
        profiles = profiles.filter((p) => p.distance_km === undefined || p.distance_km <= maxDistanceKm);
      }
    }

    if (sort === 'distance' && userCoords) {
      profiles.sort((a, b) => (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity));
    } else if (sort === 'name') {
      profiles.sort((a, b) => a.business_name.localeCompare(b.business_name));
    } else {
      // Default: verified first, then followers
      profiles.sort((a, b) => {
        if (Boolean(b.is_verified) !== Boolean(a.is_verified)) {
          return b.is_verified ? 1 : -1;
        }
        return (b.followers_count || 0) - (a.followers_count || 0);
      });
    }

    return profiles;
  }

  public getPostsByUser(userId: string, viewerId?: string, sort: 'latest' | 'popular' = 'latest'): Post[] {
    if (viewerId && this.isBlocked(viewerId, userId)) {
      return [];
    }
    return this.getPosts({ viewerId, userId, sort });
  }

  public createPost(data: Omit<Post, 'id' | 'is_deleted' | 'created_at' | 'updated_at'>): Post {
    const now = new Date().toISOString();
    const newPost: Post = {
      ...data,
      id: 'post_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      is_deleted: false,
      likes_count: 0,
      comments_count: 0,
      created_at: now,
      updated_at: now,
    };

    this.state.posts.unshift(newPost);
    this.saveState(this.state);
    this.logActivity(newPost.user_id, 'post_created', 'posts', newPost.id, null, newPost);
    return { ...newPost, user: this.getProfile(newPost.user_id) || undefined };
  }

  public updatePost(postId: string, userId: string, updates: Partial<Post>): Post {
    const postIndex = this.state.posts.findIndex((p) => p.id === postId);
    if (postIndex === -1) throw new Error('Post not found');
    const existing = this.state.posts[postIndex];

    if (existing.user_id !== userId) {
      throw new Error('RLS Violation: You can only edit your own posts.');
    }

    const updated: Post = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    this.state.posts[postIndex] = updated;
    this.saveState(this.state);
    this.logActivity(userId, 'post_edited', 'posts', postId, existing, updated);
    return { ...updated, user: this.getProfile(updated.user_id) || undefined };
  }

  // --- CONTENT RETENTION & REMOVAL LIFECYCLE (RPC soft_delete_content) ---
  public softDeleteContent(
    contentType: 'post' | 'comment',
    contentId: string,
    reason: DeletionReason,
    actorId: string,
    reportId?: string
  ): { success: boolean; purge_eligible_at: string; retention_days: number } {
    const now = new Date();
    const policy = this.state.retentionPolicies.find(
      (p) => p.content_type === contentType && p.deletion_reason === reason
    );
    const retentionDays = policy ? policy.retention_days : reason === 'moderator_removed' ? 14 : 30;
    const purgeEligibleAt = new Date(now.getTime() + retentionDays * 24 * 60 * 60 * 1000).toISOString();

    if (contentType === 'post') {
      const post = this.state.posts.find((p) => p.id === contentId);
      if (!post) throw new Error('Post not found');

      if (reason === 'user_deleted' && post.user_id !== actorId) {
        throw new Error('RLS Violation: Only the original author can soft delete this post.');
      }
      if (reason === 'moderator_removed' && !this.isStaff(actorId)) {
        throw new Error('Permission denied: Only staff/moderators can perform moderator removals.');
      }

      const oldData = { ...post };
      post.is_deleted = true;
      post.deleted_at = now.toISOString();
      post.deleted_by = actorId;
      post.deletion_reason = reason;
      post.purge_eligible_at = purgeEligibleAt;
      post.updated_at = now.toISOString();

      this.saveState(this.state);
      this.logActivity(actorId, 'post_deleted', 'posts', contentId, oldData, {
        is_deleted: true,
        deleted_at: post.deleted_at,
        deleted_by: actorId,
        deletion_reason: reason,
        purge_eligible_at: purgeEligibleAt,
        report_id: reportId || null,
      });

      return { success: true, purge_eligible_at: purgeEligibleAt, retention_days: retentionDays };
    } else if (contentType === 'comment') {
      const comment = this.state.comments.find((c) => c.id === contentId);
      if (!comment) throw new Error('Comment not found');

      if (reason === 'user_deleted' && comment.user_id !== actorId) {
        throw new Error('RLS Violation: Only the comment author can soft delete this comment.');
      }
      if (reason === 'moderator_removed' && !this.isStaff(actorId)) {
        throw new Error('Permission denied: Only staff/moderators can perform moderator removals.');
      }

      const oldData = { ...comment };
      comment.deleted_at = now.toISOString();
      comment.deleted_by = actorId;
      comment.deletion_reason = reason;
      comment.purge_eligible_at = purgeEligibleAt;
      comment.body = 'Comment removed';
      comment.content = 'Comment removed';

      this.saveState(this.state);
      this.logActivity(actorId, 'comment_deleted', 'comments', contentId, oldData, {
        deleted_at: comment.deleted_at,
        deleted_by: actorId,
        deletion_reason: reason,
        purge_eligible_at: purgeEligibleAt,
        report_id: reportId || null,
      });

      return { success: true, purge_eligible_at: purgeEligibleAt, retention_days: retentionDays };
    }

    throw new Error(`Invalid content type: ${contentType}`);
  }

  // --- RESTORE CONTENT RPC (restore_content) ---
  public restoreContent(
    contentType: 'post' | 'comment',
    contentId: string,
    actorId: string
  ): { success: boolean; message?: string } {
    const now = new Date();

    if (contentType === 'post') {
      const post = this.state.posts.find((p) => p.id === contentId);
      if (!post) throw new Error('Post not found');

      if (post.purged_at) {
        throw new Error('This post has already been permanently purged and cannot be recovered.');
      }
      if (post.deletion_reason && post.deletion_reason !== 'user_deleted') {
        throw new Error('Only self-deleted content can be restored. Content removed by moderators cannot be recovered.');
      }
      if (post.user_id !== actorId) {
        throw new Error('RLS Violation: Only the original author can restore this content.');
      }
      if (post.purge_eligible_at && new Date(post.purge_eligible_at).getTime() <= now.getTime()) {
        throw new Error('The retention period for this showcase has expired.');
      }

      const oldData = { ...post };
      post.is_deleted = false;
      post.deleted_at = null;
      post.deleted_by = null;
      post.deletion_reason = null;
      post.purge_eligible_at = null;
      post.updated_at = now.toISOString();

      this.saveState(this.state);
      this.logActivity(actorId, 'post_created', 'posts', contentId, oldData, {
        is_deleted: false,
        restored_at: now.toISOString(),
      });

      return { success: true, message: 'Showcase post successfully restored to feed!' };
    } else if (contentType === 'comment') {
      const comment = this.state.comments.find((c) => c.id === contentId);
      if (!comment) throw new Error('Comment not found');

      if (comment.purged_at) {
        throw new Error('This comment has already been permanently purged.');
      }
      if (comment.deletion_reason && comment.deletion_reason !== 'user_deleted') {
        throw new Error('Only self-deleted comments can be restored.');
      }
      if (comment.user_id !== actorId) {
        throw new Error('RLS Violation: Only the author can restore this comment.');
      }
      if (comment.purge_eligible_at && new Date(comment.purge_eligible_at).getTime() <= now.getTime()) {
        throw new Error('The retention period for this comment has expired.');
      }

      const originalLog = this.state.activityLogs
        .filter((l) => l.entity_id === contentId && l.entity_type === 'comments' && l.old_data?.body)
        .reverse()[0];
      const restoredBody = originalLog?.old_data?.body || (comment.body !== 'Comment removed' ? comment.body : 'Restored comment');

      const oldData = { ...comment };
      comment.deleted_at = null;
      comment.deleted_by = null;
      comment.deletion_reason = null;
      comment.purge_eligible_at = null;
      comment.body = restoredBody;
      comment.content = restoredBody;

      this.saveState(this.state);
      this.logActivity(actorId, 'comment_created', 'comments', contentId, oldData, {
        restored_at: now.toISOString(),
      });

      return { success: true, message: 'Comment successfully restored!' };
    }

    throw new Error(`Invalid content type: ${contentType}`);
  }

  public softDeletePost(postId: string, userId: string): boolean {
    const res = this.softDeleteContent('post', postId, 'user_deleted', userId);
    return res.success;
  }

  // --- TOGGLE POST LIKE ---
  public togglePostLike(postId: string, userId: string): { isLiked: boolean; likesCount: number } {
    const post = this.state.posts.find((p) => p.id === postId);
    if (!post) throw new Error('Post not found');

    const currentLikes = post.like_count ?? post.likes_count ?? 0;
    const isCurrentlyLiked = Boolean(post.is_liked);
    const newLiked = !isCurrentlyLiked;
    const newCount = newLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1);

    post.is_liked = newLiked;
    post.likes_count = newCount;
    post.like_count = newCount;
    this.saveState(this.state);

    if (newLiked) {
      this.logActivity(userId, 'post_liked', 'posts', postId, null, { likes_count: newCount });
      if (post.user_id !== userId) {
        this.createNotification({
          user_id: post.user_id,
          actor_id: userId,
          type: 'like',
          target_id: postId,
          title: 'New Like',
          message: 'Someone liked your craft showcase.',
        });
      }
    }

    return { isLiked: newLiked, likesCount: newCount };
  }

  // --- BUSINESS INSIGHTS DASHBOARD ENGINE ---
  public getBusinessInsights(
    userId: string,
    timeRange: '7d' | '30d' | 'all' = '7d'
  ): BusinessInsightsData {
    const profile = this.getProfile(userId) || INITIAL_PROFILES[0];
    const userPosts = this.state.posts.filter((p) => p.user_id === userId && !p.is_deleted);

    // Totals
    const totalPosts = userPosts.length;
    const totalViews = userPosts.reduce((acc, p) => acc + (p.view_count || 0), 0);
    const totalLikes = userPosts.reduce((acc, p) => acc + (p.like_count ?? p.likes_count ?? 0), 0);
    const totalComments = userPosts.reduce((acc, p) => acc + (p.comment_count ?? p.comments_count ?? 0), 0);
    const totalShares = userPosts.reduce((acc, p) => acc + (p.share_count || 0), 0);
    const totalSaves = userPosts.reduce((acc, p) => acc + (p.save_count || 0), 0);
    const totalInteractions = totalLikes + totalComments + totalShares + totalSaves;
    const overallEngagementRate = totalViews > 0 ? Number(((totalInteractions / totalViews) * 100).toFixed(1)) : 0;
    const likesRatio = totalViews > 0 ? Number(((totalLikes / totalViews) * 100).toFixed(1)) : 0;

    // 24h Views Velocity
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const userPostIds = new Set(userPosts.map((p) => p.id));
    const views24h = this.state.postViews.filter(
      (pv) => userPostIds.has(pv.post_id) && new Date(pv.created_at).getTime() >= oneDayAgo
    ).length;
    const viewsVelocity24h = views24h > 0 ? views24h : Math.round(totalViews * 0.18);

    // Media type breakdown
    const mediaGroups: Record<MediaType, { count: number; views: number; likes: number; comments: number }> = {
      image: { count: 0, views: 0, likes: 0, comments: 0 },
      video: { count: 0, views: 0, likes: 0, comments: 0 },
      audio: { count: 0, views: 0, likes: 0, comments: 0 },
    };

    userPosts.forEach((p) => {
      const type = p.media_type || 'image';
      if (!mediaGroups[type]) {
        mediaGroups[type] = { count: 0, views: 0, likes: 0, comments: 0 };
      }
      mediaGroups[type].count += 1;
      mediaGroups[type].views += p.view_count || 0;
      mediaGroups[type].likes += p.like_count ?? p.likes_count ?? 0;
      mediaGroups[type].comments += p.comment_count ?? p.comments_count ?? 0;
    });

    const mediaBreakdown: MediaTypeBreakdown[] = [
      {
        name: 'Photos',
        type: 'image' as MediaType,
        count: mediaGroups.image.count,
        totalViews: mediaGroups.image.views,
        totalLikes: mediaGroups.image.likes,
        totalComments: mediaGroups.image.comments,
        avgEngagement:
          mediaGroups.image.views > 0
            ? Number((((mediaGroups.image.likes + mediaGroups.image.comments) / mediaGroups.image.views) * 100).toFixed(1))
            : 0,
        color: '#f97316',
      },
      {
        name: 'Videos',
        type: 'video' as MediaType,
        count: mediaGroups.video.count,
        totalViews: mediaGroups.video.views,
        totalLikes: mediaGroups.video.likes,
        totalComments: mediaGroups.video.comments,
        avgEngagement:
          mediaGroups.video.views > 0
            ? Number((((mediaGroups.video.likes + mediaGroups.video.comments) / mediaGroups.video.views) * 100).toFixed(1))
            : 0,
        color: '#ef4444',
      },
      {
        name: 'Audio Stories',
        type: 'audio' as MediaType,
        count: mediaGroups.audio.count,
        totalViews: mediaGroups.audio.views,
        totalLikes: mediaGroups.audio.likes,
        totalComments: mediaGroups.audio.comments,
        avgEngagement:
          mediaGroups.audio.views > 0
            ? Number((((mediaGroups.audio.likes + mediaGroups.audio.comments) / mediaGroups.audio.views) * 100).toFixed(1))
            : 0,
        color: '#8b5cf6',
      },
    ].filter((m) => m.count > 0 || totalPosts === 0);

    const bestFormat = [...mediaBreakdown].sort((a, b) => b.avgEngagement - a.avgEngagement)[0];
    const bestPerformingFormat = bestFormat ? bestFormat.name : 'Photos';

    // Daily Timeline Data
    const daysCount = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 14;
    const dailyTimeline: DailyEngagementPoint[] = [];
    const now = new Date();

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const isoDate = d.toISOString().split('T')[0];
      const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const dayFactor = 0.5 + Math.sin(i * 0.8) * 0.3 + ((daysCount - i) / daysCount) * 0.4;
      const dayViews = Math.max(6, Math.round((totalViews / (daysCount * 0.8 || 1)) * dayFactor));
      const dayLikes = Math.max(1, Math.round((totalLikes / (daysCount * 0.8 || 1)) * dayFactor));
      const dayComments = Math.max(0, Math.round((totalComments / (daysCount * 0.9 || 1)) * dayFactor));
      const dayShares = Math.max(0, Math.round((totalShares / (daysCount * 0.9 || 1)) * dayFactor));
      const daySaves = Math.max(0, Math.round((totalSaves / (daysCount * 0.9 || 1)) * dayFactor));
      const rate = dayViews > 0 ? Number((((dayLikes + dayComments + dayShares + daySaves) / dayViews) * 100).toFixed(1)) : 0;

      dailyTimeline.push({
        date: isoDate,
        dateLabel,
        views: dayViews,
        likes: dayLikes,
        comments: dayComments,
        shares: dayShares,
        saves: daySaves,
        engagementRate: rate,
      });
    }

    // Post Performance
    const postPerformance: PostMetricPoint[] = userPosts.map((p) => {
      const views = p.view_count || 0;
      const likes = p.like_count ?? p.likes_count ?? 0;
      const comments = p.comment_count ?? p.comments_count ?? 0;
      const shares = p.share_count || 0;
      const saves = p.save_count || 0;
      const engagement = views > 0 ? Number((((likes + comments + shares + saves) / views) * 100).toFixed(1)) : 0;

      return {
        id: p.id,
        caption: p.caption,
        shortCaption: p.caption.length > 32 ? p.caption.substring(0, 32) + '...' : p.caption,
        media_type: p.media_type,
        media_url: p.media_url,
        thumbnail_url: p.thumbnail_url,
        created_at: p.created_at,
        views,
        likes,
        comments,
        shares,
        saves,
        engagementRate: engagement,
        trendingScore: p.trending_score || 0,
      };
    }).sort((a, b) => b.views - a.views);

    // Hourly Distribution
    const hourlyDistribution: HourlyDistributionPoint[] = [
      { slot: 'morning', label: 'Morning (6am - 12pm)', views: Math.round(totalViews * 0.32), interactions: Math.round(totalInteractions * 0.35) },
      { slot: 'afternoon', label: 'Afternoon (12pm - 5pm)', views: Math.round(totalViews * 0.42), interactions: Math.round(totalInteractions * 0.45) },
      { slot: 'evening', label: 'Evening (5pm - 10pm)', views: Math.round(totalViews * 0.20), interactions: Math.round(totalInteractions * 0.16) },
      { slot: 'night', label: 'Night (10pm - 6am)', views: Math.round(totalViews * 0.06), interactions: Math.round(totalInteractions * 0.04) },
    ];

    // Growth recommendations
    const recommendations: string[] = [];
    const videoStats = mediaBreakdown.find((m) => m.type === 'video');
    const photoStats = mediaBreakdown.find((m) => m.type === 'image');
    if (videoStats && photoStats && videoStats.avgEngagement > photoStats.avgEngagement) {
      const multiplier = Math.max(1.3, Number((videoStats.avgEngagement / (photoStats.avgEngagement || 1)).toFixed(1)));
      recommendations.push(
        `Video showcases generate ${multiplier}x higher interaction rates than static photos. Quick 15s clips of your workbench or roaster draw more repeat comments.`
      );
    }
    recommendations.push(
      `Peak community activity for ${profile.business_name} concentrates between 12:00 PM and 5:00 PM. Schedule major showcases during this afternoon window.`
    );
    if (postPerformance.length > 0) {
      const topPost = postPerformance[0];
      recommendations.push(
        `"${topPost.shortCaption}" had a ${topPost.engagementRate}% engagement rate (${topPost.likes} likes, ${topPost.comments} comments). Detailed process explanations drive the highest saves.`
      );
    }
    recommendations.push(
      `Showcases with descriptive origin details receive 28% more profile visits and bookmark saves.`
    );

    return {
      business: profile,
      timeRange,
      summary: {
        totalPosts,
        totalViews,
        totalLikes,
        totalComments,
        totalShares,
        totalSaves,
        overallEngagementRate,
        bestPerformingFormat,
        viewsVelocity24h,
        likesRatio,
      },
      dailyTimeline,
      postPerformance,
      mediaBreakdown,
      hourlyDistribution,
      growthRecommendations: recommendations,
    };
  }

  // --- COMMENTS V2 SYSTEM (FULL SPEC) ---

  // Rate Limiting: Max 10 comments per minute per user
  public checkCommentRateLimit(userId: string): boolean {
    const oneMinuteAgo = Date.now() - 60 * 1000;
    const count = this.state.comments.filter(
      (c) => c.user_id === userId && new Date(c.created_at).getTime() >= oneMinuteAgo
    ).length;
    return count < 10;
  }

  // Basic spam / profanity filter
  public checkCommentContent(body: string): { valid: boolean; reason?: string } {
    const blockList = [
      'buy followers',
      'free crypto',
      't.me/scam',
      'whatsapp money',
      'viagra',
      'click here to win',
      'cash grant fast',
    ];
    const lower = body.toLowerCase();
    for (const phrase of blockList) {
      if (lower.includes(phrase)) {
        return {
          valid: false,
          reason: `Comment contains prohibited or spam phrase ("${phrase}"). Please keep community discussions constructive.`,
        };
      }
    }
    return { valid: true };
  }

  public getComments(
    postId: string,
    viewerId?: string,
    sortBy: 'top' | 'newest' = 'top'
  ): Comment[] {
    const allForPost = this.state.comments.filter((c) => c.post_id === postId);

    // Filter blocked users
    const filtered = allForPost.filter((c) => {
      if (viewerId && this.isBlocked(viewerId, c.user_id)) return false;
      return true;
    });

    // Populate user, likes count, is_liked
    const enriched: Comment[] = filtered.map((c) => {
      const likesCount = this.state.commentLikes.filter((cl) => cl.comment_id === c.id).length;
      const isLiked = viewerId
        ? this.state.commentLikes.some((cl) => cl.comment_id === c.id && cl.user_id === viewerId)
        : false;

      return {
        ...c,
        body: c.body || c.content || '',
        user: this.getProfile(c.user_id, viewerId) || undefined,
        likes_count: likesCount || c.likes_count || 0,
        is_liked: isLiked,
      };
    });

    // Separate top-level comments and replies
    const topLevel = enriched.filter((c) => !c.parent_comment_id);
    const replies = enriched.filter((c) => Boolean(c.parent_comment_id));

    // Attach replies to top-level comments (1-level deep)
    const result: Comment[] = [];
    for (const parent of topLevel) {
      const childReplies = replies
        .filter((r) => r.parent_comment_id === parent.id)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      // If parent is deleted and has no replies, exclude it
      if (parent.deleted_at && childReplies.length === 0) {
        continue;
      }

      result.push({
        ...parent,
        replies: childReplies,
      });
    }

    // Sort top-level comments:
    // Pinned comment ALWAYS comes first!
    result.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;

      if (sortBy === 'top') {
        const diffLikes = (b.likes_count || 0) - (a.likes_count || 0);
        if (diffLikes !== 0) return diffLikes;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return result;
  }

  public addComment(
    postId: string,
    userId: string,
    bodyText: string,
    parentCommentId?: string | null,
    mentionedUserIds?: string[]
  ): Comment {
    const post = this.state.posts.find((p) => p.id === postId && !p.is_deleted);
    if (!post) throw new Error('Post not found');

    if (this.isBlocked(userId, post.user_id)) {
      throw new Error('Cannot comment on showcases from blocked businesses');
    }

    if (!this.checkCommentRateLimit(userId)) {
      throw new Error('Rate limit exceeded: You can post up to 10 comments per minute. Please take a brief pause.');
    }

    const trimmed = bodyText.trim();
    if (!trimmed) throw new Error('Comment cannot be empty');
    if (trimmed.length > 500) throw new Error('Comment exceeds 500 characters limit');

    const spamCheck = this.checkCommentContent(trimmed);
    if (!spamCheck.valid) {
      throw new Error(spamCheck.reason || 'Comment contains prohibited keywords.');
    }

    // Resolve parent comment: enforce exactly one level deep
    let resolvedParentId: string | null = null;
    if (parentCommentId) {
      const parent = this.state.comments.find((c) => c.id === parentCommentId);
      if (parent) {
        // If the referenced comment is itself a reply, attach to its parent!
        resolvedParentId = parent.parent_comment_id ? parent.parent_comment_id : parent.id;
      }
    }

    const now = new Date().toISOString();
    const commentId = 'comm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

    const comment: Comment = {
      id: commentId,
      post_id: postId,
      user_id: userId,
      parent_comment_id: resolvedParentId,
      body: trimmed,
      content: trimmed,
      is_pinned: false,
      is_edited: false,
      created_at: now,
      likes_count: 0,
      is_liked: false,
      replies: [],
    };

    this.state.comments.push(comment);

    // Send notifications
    const commenter = this.getProfile(userId);
    const commenterName = commenter?.business_name || 'An artisan';

    // 1. Notify post owner if top-level comment and actor !== post.user_id
    if (!resolvedParentId && post.user_id !== userId) {
      this.createNotification({
        user_id: post.user_id,
        actor_id: userId,
        type: 'comment',
        target_id: postId,
        title: 'New Comment',
        message: `${commenterName} commented on your showcase: "${trimmed.slice(0, 40)}..."`,
      });
    }

    // 2. Notify parent commenter if reply and actor !== parentComment.user_id
    if (resolvedParentId) {
      const parent = this.state.comments.find((c) => c.id === resolvedParentId);
      if (parent && parent.user_id !== userId) {
        this.createNotification({
          user_id: parent.user_id,
          actor_id: userId,
          type: 'reply',
          target_id: postId,
          title: 'Reply to Your Comment',
          message: `${commenterName} replied: "${trimmed.slice(0, 40)}..."`,
        });
      }
    }

    // 3. Notify mentioned users (deduplicated)
    const mentionedSet = new Set<string>(mentionedUserIds || []);
    // Also parse @Mentions in body
    const mentionRegex = /@([a-zA-Z0-9_\s]{2,30})/g;
    let match;
    while ((match = mentionRegex.exec(trimmed)) !== null) {
      const name = match[1].trim().toLowerCase();
      const matchedUser = this.state.profiles.find((p) => p.business_name.toLowerCase() === name);
      if (matchedUser && matchedUser.id !== userId) {
        mentionedSet.add(matchedUser.id);
      }
    }

    mentionedSet.forEach((targetUserId) => {
      if (targetUserId !== userId) {
        this.createNotification({
          user_id: targetUserId,
          actor_id: userId,
          type: 'mention',
          target_id: postId,
          title: 'You were mentioned',
          message: `${commenterName} mentioned your business in a comment.`,
        });
      }
    });

    this.saveState(this.state);
    this.logActivity(userId, 'comment_created', 'comments', comment.id, null, comment);

    return {
      ...comment,
      user: commenter || undefined,
    };
  }

  public toggleCommentLike(commentId: string, userId: string): { isLiked: boolean; likesCount: number } {
    const existingIdx = this.state.commentLikes.findIndex(
      (cl) => cl.comment_id === commentId && cl.user_id === userId
    );

    let isLiked = false;
    if (existingIdx >= 0) {
      this.state.commentLikes.splice(existingIdx, 1);
      isLiked = false;
    } else {
      this.state.commentLikes.push({
        comment_id: commentId,
        user_id: userId,
        created_at: new Date().toISOString(),
      });
      isLiked = true;

      // Notify comment author if not liking own comment
      const comment = this.state.comments.find((c) => c.id === commentId);
      if (comment && comment.user_id !== userId) {
        const liker = this.getProfile(userId);
        this.createNotification({
          user_id: comment.user_id,
          actor_id: userId,
          type: 'like',
          target_id: comment.post_id,
          title: 'Comment Liked',
          message: `${liker?.business_name || 'An artisan'} liked your comment.`,
        });
      }
    }

    const likesCount = this.state.commentLikes.filter((cl) => cl.comment_id === commentId).length;

    // Update count in comment cache
    const comment = this.state.comments.find((c) => c.id === commentId);
    if (comment) {
      comment.likes_count = likesCount;
    }

    this.saveState(this.state);
    this.logActivity(userId, isLiked ? 'comment_liked' : 'comment_unliked', 'comments', commentId);
    return { isLiked, likesCount };
  }

  public togglePinComment(postId: string, commentId: string, actorUserId: string): boolean {
    const post = this.state.posts.find((p) => p.id === postId);
    if (!post) throw new Error('Post not found');

    if (post.user_id !== actorUserId) {
      throw new Error('RLS Violation: Only the post owner can pin comments.');
    }

    const targetComment = this.state.comments.find((c) => c.id === commentId && c.post_id === postId);
    if (!targetComment) throw new Error('Comment not found on this post');

    const currentlyPinned = Boolean(targetComment.is_pinned);

    // Unpin all other comments on this post (exactly one pinned comment allowed)
    this.state.comments.forEach((c) => {
      if (c.post_id === postId) c.is_pinned = false;
    });

    // Toggle target
    targetComment.is_pinned = !currentlyPinned;
    this.saveState(this.state);
    this.logActivity(
      actorUserId,
      targetComment.is_pinned ? 'comment_pinned' : 'comment_unpinned',
      'comments',
      commentId
    );
    return targetComment.is_pinned;
  }

  public editComment(commentId: string, actorUserId: string, newBody: string): Comment {
    const comment = this.state.comments.find((c) => c.id === commentId);
    if (!comment) throw new Error('Comment not found');

    if (comment.user_id !== actorUserId) {
      throw new Error('RLS Violation: You can only edit your own comments.');
    }

    // Check 5 minutes window
    const ageMs = Date.now() - new Date(comment.created_at).getTime();
    if (ageMs > 5 * 60 * 1000) {
      throw new Error('Comments can only be edited within 5 minutes of posting.');
    }

    const trimmed = newBody.trim();
    if (!trimmed) throw new Error('Comment body cannot be empty');
    if (trimmed.length > 500) throw new Error('Comment exceeds 500 characters limit');

    const spamCheck = this.checkCommentContent(trimmed);
    if (!spamCheck.valid) {
      throw new Error(spamCheck.reason || 'Comment contains prohibited keywords.');
    }

    const oldBody = comment.body;
    comment.body = trimmed;
    comment.content = trimmed;
    comment.is_edited = true;
    comment.edited_at = new Date().toISOString();

    this.saveState(this.state);
    this.logActivity(actorUserId, 'comment_edited', 'comments', commentId, { body: oldBody }, { body: trimmed });

    return {
      ...comment,
      user: this.getProfile(comment.user_id) || undefined,
    };
  }

  public deleteComment(commentId: string, actorUserId: string): boolean {
    const comment = this.state.comments.find((c) => c.id === commentId);
    if (!comment) return false;
    const post = this.state.posts.find((p) => p.id === comment.post_id);

    const isCommentAuthor = comment.user_id === actorUserId;
    const isPostOwner = post?.user_id === actorUserId;

    if (!isCommentAuthor && !isPostOwner) {
      throw new Error('RLS Violation: Only the comment author or post owner can delete this comment.');
    }

    // Check if this comment has replies
    const hasReplies = this.state.comments.some((c) => c.parent_comment_id === commentId && !c.deleted_at);

    if (hasReplies) {
      // Soft delete: keep row in place so replies remain visible
      comment.deleted_at = new Date().toISOString();
      comment.body = 'Comment removed';
      comment.content = 'Comment removed';
    } else {
      // Remove from list
      const idx = this.state.comments.findIndex((c) => c.id === commentId);
      if (idx >= 0) this.state.comments.splice(idx, 1);
    }

    this.saveState(this.state);
    this.logActivity(
      actorUserId,
      isPostOwner && !isCommentAuthor ? 'comment_moderated' : 'comment_deleted',
      'comments',
      commentId
    );
    return true;
  }

  // --- NOTIFICATIONS ---
  public createNotification(data: Omit<AppNotification, 'id' | 'is_read' | 'created_at'>) {
    const notif: AppNotification = {
      ...data,
      id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      is_read: false,
      created_at: new Date().toISOString(),
    };
    this.state.notifications.unshift(notif);
    this.saveState(this.state);
  }

  public getNotifications(userId: string): AppNotification[] {
    return this.state.notifications
      .filter((n) => n.user_id === userId)
      .map((n) => ({
        ...n,
        actor: this.getProfile(n.actor_id) || undefined,
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public markNotificationRead(notifId: string) {
    const notif = this.state.notifications.find((n) => n.id === notifId);
    if (notif) {
      notif.is_read = true;
      this.saveState(this.state);
    }
  }

  public markAllNotificationsRead(userId: string) {
    this.state.notifications.forEach((n) => {
      if (n.user_id === userId) n.is_read = true;
    });
    this.saveState(this.state);
  }

  // --- MESSAGING WITH INBOX REPLY LIMIT ---
  public canSendMessage(senderId: string, recipientId: string): { allowed: boolean; reason?: string } {
    if (senderId === recipientId) {
      return { allowed: false, reason: 'You cannot send messages to yourself.' };
    }
    if (this.isBlocked(senderId, recipientId)) {
      return { allowed: false, reason: 'Messaging is unavailable because of a block.' };
    }

    const thread = this.state.messages
      .filter(
        (m) =>
          (m.sender_id === senderId && m.recipient_id === recipientId) ||
          (m.sender_id === recipientId && m.recipient_id === senderId)
      )
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    if (thread.length === 0) {
      return { allowed: true };
    }

    const lastMsg = thread[0];
    if (lastMsg.sender_id === recipientId) {
      return { allowed: true };
    }

    const recipientProfile = this.getProfile(recipientId);
    const recipientName = recipientProfile?.business_name || 'the business';
    return {
      allowed: false,
      reason: `Waiting for reply: To keep artisan inboxes focused and prevent spam, you can send another message once ${recipientName} replies.`,
    };
  }

  public sendMessage(senderId: string, recipientId: string, content: string): Message {
    const check = this.canSendMessage(senderId, recipientId);
    if (!check.allowed) {
      throw new Error(check.reason || 'Cannot send message.');
    }

    const message: Message = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      sender_id: senderId,
      recipient_id: recipientId,
      content: content.trim(),
      is_read: false,
      created_at: new Date().toISOString(),
    };

    this.state.messages.push(message);
    this.saveState(this.state);
    this.logActivity(senderId, 'message_sent', 'messages', message.id, null, { recipient_id: recipientId });

    return {
      ...message,
      sender: this.getProfile(senderId) || undefined,
      recipient: this.getProfile(recipientId) || undefined,
    };
  }

  public getMessages(userA: string, userB: string): Message[] {
    return this.state.messages
      .filter(
        (m) =>
          (m.sender_id === userA && m.recipient_id === userB) ||
          (m.sender_id === userB && m.recipient_id === userA)
      )
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((m) => ({
        ...m,
        sender: this.getProfile(m.sender_id) || undefined,
        recipient: this.getProfile(m.recipient_id) || undefined,
      }));
  }

  public getConversations(userId: string): Conversation[] {
    const conversationMap = new Map<string, { lastMsg: Message; unreadCount: number }>();

    for (const msg of this.state.messages) {
      if (msg.sender_id !== userId && msg.recipient_id !== userId) continue;
      const otherId = msg.sender_id === userId ? msg.recipient_id : msg.sender_id;

      const existing = conversationMap.get(otherId);
      const isUnread = msg.recipient_id === userId && !msg.is_read;

      if (!existing) {
        conversationMap.set(otherId, {
          lastMsg: msg,
          unreadCount: isUnread ? 1 : 0,
        });
      } else {
        if (new Date(msg.created_at).getTime() > new Date(existing.lastMsg.created_at).getTime()) {
          existing.lastMsg = msg;
        }
        if (isUnread) {
          existing.unreadCount += 1;
        }
      }
    }

    const conversations: Conversation[] = [];
    conversationMap.forEach(({ lastMsg, unreadCount }, otherId) => {
      const otherProfile = this.getProfile(otherId);
      if (!otherProfile) return;
      const sendCheck = this.canSendMessage(userId, otherId);

      conversations.push({
        other_user: otherProfile,
        last_message: lastMsg,
        unread_count: unreadCount,
        can_send_next: sendCheck.allowed,
        waiting_reason: sendCheck.reason,
      });
    });

    return conversations.sort(
      (a, b) => new Date(b.last_message.created_at).getTime() - new Date(a.last_message.created_at).getTime()
    );
  }

  public markConversationRead(userId: string, otherUserId: string) {
    let changed = false;
    this.state.messages.forEach((m) => {
      if (m.recipient_id === userId && m.sender_id === otherUserId && !m.is_read) {
        m.is_read = true;
        changed = true;
      }
    });
    if (changed) {
      this.saveState(this.state);
    }
  }

  public simulateReply(otherUserId: string, currentUserId: string): Message {
    const sampleReplies = [
      'Thanks for reaching out! We would be delighted to work together.',
      'Hello! Our craft studio is open Tuesday through Saturday, drop by anytime.',
      'We just saw your latest showcase—stellar work! Yes, let’s coordinate on this.',
      'Received! Let me check our artisan schedule and get back to you shortly.',
    ];
    const text = sampleReplies[Math.floor(Math.random() * sampleReplies.length)];

    const message: Message = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      sender_id: otherUserId,
      recipient_id: currentUserId,
      content: text,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    this.state.messages.push(message);
    this.saveState(this.state);
    this.logActivity(otherUserId, 'message_sent', 'messages', message.id, null, { recipient_id: currentUserId });
    return message;
  }

  // --- FOLLOWS ---
  public followUser(followerId: string, followingId: string): boolean {
    if (followerId === followingId) return false;
    if (this.isBlocked(followerId, followingId)) return false;

    const existing = this.state.follows.find(
      (f) => f.follower_id === followerId && f.following_id === followingId
    );
    if (existing) return true;

    const target = this.state.profiles.find((p) => p.id === followingId);
    const status: FollowStatus = target?.is_private ? 'pending' : 'accepted';

    const follow: Follow = {
      follower_id: followerId,
      following_id: followingId,
      status,
      created_at: new Date().toISOString(),
    };

    this.state.follows.push(follow);

    if (followerId !== followingId) {
      const followerProfile = this.getProfile(followerId);
      this.createNotification({
        user_id: followingId,
        actor_id: followerId,
        type: 'follow',
        target_id: followingId,
        title: 'New Follower',
        message: `${followerProfile?.business_name || 'An artisan'} started following your business.`,
      });
    }

    this.saveState(this.state);
    this.logActivity(followerId, 'followed', 'follows', `${followerId}:${followingId}`, null, follow);
    return true;
  }

  public unfollowUser(followerId: string, followingId: string): boolean {
    const index = this.state.follows.findIndex(
      (f) => f.follower_id === followerId && f.following_id === followingId
    );
    if (index === -1) return false;

    const old = this.state.follows[index];
    this.state.follows.splice(index, 1);
    this.saveState(this.state);
    this.logActivity(followerId, 'unfollowed', 'follows', `${followerId}:${followingId}`, old, null);
    return true;
  }

  public removeFollower(followingId: string, followerId: string): boolean {
    const index = this.state.follows.findIndex(
      (f) => f.follower_id === followerId && f.following_id === followingId
    );
    if (index === -1) return false;

    const old = this.state.follows[index];
    this.state.follows.splice(index, 1);
    this.saveState(this.state);
    this.logActivity(followingId, 'follower_removed', 'follows', `${followerId}:${followingId}`, old, null);
    return true;
  }

  public isFollowing(followerId: string, followingId: string): boolean {
    return this.state.follows.some(
      (f) => f.follower_id === followerId && f.following_id === followingId && f.status === 'accepted'
    );
  }

  // --- BLOCKS ---
  public blockUser(blockerId: string, blockedId: string): boolean {
    if (blockerId === blockedId) return false;
    if (this.isBlocked(blockerId, blockedId)) return true;

    const block: Block = {
      blocker_id: blockerId,
      blocked_id: blockedId,
      created_at: new Date().toISOString(),
    };
    this.state.blocks.push(block);

    // Remove follow links
    this.state.follows = this.state.follows.filter(
      (f) =>
        !(
          (f.follower_id === blockerId && f.following_id === blockedId) ||
          (f.follower_id === blockedId && f.following_id === blockerId)
        )
    );

    this.saveState(this.state);
    this.logActivity(blockerId, 'blocked', 'blocks', blockedId, null, block);
    return true;
  }

  public unblockUser(blockerId: string, blockedId: string): boolean {
    const index = this.state.blocks.findIndex(
      (b) => b.blocker_id === blockerId && b.blocked_id === blockedId
    );
    if (index === -1) return false;

    this.state.blocks.splice(index, 1);
    this.saveState(this.state);
    this.logActivity(blockerId, 'unblocked', 'blocks', blockedId, null, null);
    return true;
  }

  public isBlocked(userA: string, userB: string): boolean {
    return this.state.blocks.some(
      (b) =>
        (b.blocker_id === userA && b.blocked_id === userB) ||
        (b.blocker_id === userB && b.blocked_id === userA)
    );
  }

  public getBlockedUsers(userId: string): Profile[] {
    const ids = this.state.blocks.filter((b) => b.blocker_id === userId).map((b) => b.blocked_id);
    return ids.map((id) => this.getProfile(id)).filter((p): p is Profile => Boolean(p));
  }

  // --- REPORTS ---
  public reportTarget(
    reporterId: string,
    targetType: 'post' | 'profile' | 'comment',
    targetId: string,
    reason: string,
    details?: string
  ): Report {
    const report: Report = {
      id: 'rep_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      reporter_id: reporterId,
      target_type: targetType,
      target_id: targetId,
      reason,
      details,
      status: 'open',
      created_at: new Date().toISOString(),
    };
    this.state.reports.push(report);
    this.saveState(this.state);
    this.logActivity(reporterId, 'reported', 'reports', targetId, null, { target_type: targetType, reason });
    return report;
  }

  public getReports(): Report[] {
    return this.state.reports.map((r) => ({
      ...r,
      reporter: this.getProfile(r.reporter_id) || undefined,
    }));
  }

  public updateReportStatus(reportId: string, status: 'open' | 'in_review' | 'resolved' | 'dismissed'): boolean {
    const report = this.state.reports.find((r) => r.id === reportId);
    if (!report) return false;
    report.status = status;
    this.saveState(this.state);
    return true;
  }

  // --- STAFF & VERIFICATION ---
  public isStaff(userId: string): boolean {
    return this.state.staffRoles.some((r) => r.user_id === userId);
  }

  public getStaffRole(userId: string): 'admin' | 'moderator' | null {
    const staff = this.state.staffRoles.find((r) => r.user_id === userId);
    return staff ? staff.role : null;
  }

  public getVerificationRequests(): VerificationRequest[] {
    return this.state.verificationRequests.map((vr) => ({
      ...vr,
      user: this.getProfile(vr.user_id) || undefined,
    }));
  }

  public approveVerification(requestId: string, adminId: string): boolean {
    const req = this.state.verificationRequests.find((r) => r.id === requestId);
    if (!req) return false;
    req.status = 'approved';
    req.reviewed_by = adminId;
    req.reviewed_at = new Date().toISOString();

    const targetProfile = this.state.profiles.find((p) => p.id === req.user_id);
    if (targetProfile) {
      targetProfile.is_verified = true;
      targetProfile.verified_at = new Date().toISOString();
      targetProfile.verified_by = adminId;
    }

    this.saveState(this.state);
    this.logActivity(adminId, 'verified_approved', 'verification_requests', requestId, null, {
      user_id: req.user_id,
      business_name: req.business_name,
    });
    return true;
  }

  public rejectVerification(requestId: string, adminId: string, reason: string): boolean {
    const req = this.state.verificationRequests.find((r) => r.id === requestId);
    if (!req) return false;
    req.status = 'rejected';
    req.reviewed_by = adminId;
    req.reviewed_at = new Date().toISOString();
    req.rejection_reason = reason;

    this.saveState(this.state);
    this.logActivity(adminId, 'verified_rejected', 'verification_requests', requestId, null, {
      user_id: req.user_id,
      reason,
    });
    return true;
  }

  public toggleVerifiedBadge(userId: string, adminId: string): boolean {
    const profile = this.state.profiles.find((p) => p.id === userId);
    if (!profile) return false;
    profile.is_verified = !profile.is_verified;
    if (profile.is_verified) {
      profile.verified_at = new Date().toISOString();
      profile.verified_by = adminId;
    } else {
      profile.verified_at = undefined;
      profile.verified_by = undefined;
    }
    this.saveState(this.state);
    this.logActivity(adminId, profile.is_verified ? 'verified_approved' : 'verified_revoked', 'profiles', userId, null, {
      is_verified: profile.is_verified,
    });
    return true;
  }

  // --- ACTIVITY LOG (APPEND-ONLY) ---
  public getActivityLogs(userId?: string): ActivityLog[] {
    const list = userId
      ? this.state.activityLogs.filter((log) => log.user_id === userId)
      : this.state.activityLogs;

    return [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // --- TRANSACTIONS & FINANCIAL LEDGER (PostgreSQL Relational Ledger) ---
  public getTransactions(filters?: {
    status?: string;
    sellerId?: string;
    buyerId?: string;
    search?: string;
    type?: string;
  }): Transaction[] {
    let list = this.state.transactions.map((tx) => ({
      ...tx,
      buyer: this.getProfile(tx.buyer_id) || undefined,
      seller: this.getProfile(tx.seller_id) || undefined,
    }));

    if (filters?.status && filters.status !== 'all') {
      list = list.filter((t) => t.status === filters.status);
    }
    if (filters?.type && filters.type !== 'all') {
      list = list.filter((t) => t.item_type === filters.type);
    }
    if (filters?.sellerId) {
      list = list.filter((t) => t.seller_id === filters.sellerId);
    }
    if (filters?.buyerId) {
      list = list.filter((t) => t.buyer_id === filters.buyerId);
    }
    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.reference_id.toLowerCase().includes(q) ||
          t.item_title.toLowerCase().includes(q) ||
          (t.notes && t.notes.toLowerCase().includes(q)) ||
          (t.seller?.business_name && t.seller.business_name.toLowerCase().includes(q)) ||
          (t.buyer?.business_name && t.buyer.business_name.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getTransaction(id: string): Transaction | undefined {
    const tx = this.state.transactions.find((t) => t.id === id || t.reference_id === id);
    if (!tx) return undefined;
    return {
      ...tx,
      buyer: this.getProfile(tx.buyer_id) || undefined,
      seller: this.getProfile(tx.seller_id) || undefined,
    };
  }

  public recordTransaction(
    data: {
      buyer_id: string;
      seller_id: string;
      item_type: TransactionType;
      item_title: string;
      post_id?: string;
      amount_cents: number;
      payment_method?: PaymentMethod;
      notes?: string;
      shipping_address?: string;
      customer_email?: string;
      status?: TransactionStatus;
    },
    adminId = 'user_admin'
  ): Transaction {
    const now = new Date().toISOString();
    const fee_cents = Math.round(data.amount_cents * 0.05); // 5% marketplace commission
    const payout_cents = data.amount_cents - fee_cents;
    const refNum = Math.floor(1000 + Math.random() * 9000);
    const reference_id = `TXN-2026-${refNum}`;
    const id = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const status: TransactionStatus = data.status || 'settled';

    const newTx: Transaction = {
      id,
      reference_id,
      buyer_id: data.buyer_id,
      seller_id: data.seller_id,
      item_type: data.item_type,
      item_title: data.item_title,
      post_id: data.post_id,
      amount_cents: data.amount_cents,
      fee_cents,
      payout_cents,
      currency: 'USD',
      status,
      payment_method: data.payment_method || 'credit_card',
      notes: data.notes,
      shipping_address: data.shipping_address,
      customer_email: data.customer_email,
      created_at: now,
      settled_at: status === 'settled' ? now : null,
    };

    this.state.transactions.unshift(newTx);

    // Record audit log
    const audit: TransactionAuditLog = {
      id: `tx_log_${Date.now()}`,
      transaction_id: id,
      reference_id,
      admin_id: adminId,
      admin_name: this.getProfile(adminId)?.business_name || 'Administrator',
      action: 'created',
      new_status: status,
      amount_affected_cents: data.amount_cents,
      reason: `Transaction recorded: ${data.item_title} ($${(data.amount_cents / 100).toFixed(2)}) via ${data.payment_method || 'credit_card'}.`,
      created_at: now,
    };
    this.state.transactionAuditLogs.unshift(audit);

    this.logActivity(
      adminId,
      'transaction_recorded',
      'transactions',
      id,
      null,
      { reference_id, amount_cents: data.amount_cents, status }
    );

    this.saveState(this.state);
    return this.getTransaction(id)!;
  }

  public updateTransactionStatus(
    id: string,
    newStatus: TransactionStatus,
    adminId: string,
    reason: string
  ): Transaction {
    const tx = this.state.transactions.find((t) => t.id === id);
    if (!tx) throw new Error('Transaction not found');
    const oldStatus = tx.status;
    const now = new Date().toISOString();

    tx.status = newStatus;
    if (newStatus === 'settled') {
      tx.settled_at = now;
    } else if (newStatus === 'refunded') {
      tx.refunded_at = now;
    } else if (newStatus === 'disputed') {
      tx.disputed_at = now;
      tx.dispute_reason = reason;
    }

    const audit: TransactionAuditLog = {
      id: `tx_log_${Date.now()}`,
      transaction_id: tx.id,
      reference_id: tx.reference_id,
      admin_id: adminId,
      admin_name: this.getProfile(adminId)?.business_name || 'Administrator',
      action: newStatus === 'refunded' ? 'refunded' : newStatus === 'settled' ? 'settled' : 'status_changed',
      previous_status: oldStatus,
      new_status: newStatus,
      amount_affected_cents: tx.amount_cents,
      reason,
      created_at: now,
    };
    this.state.transactionAuditLogs.unshift(audit);

    this.logActivity(
      adminId,
      `transaction_${newStatus}`,
      'transactions',
      tx.id,
      { status: oldStatus },
      { status: newStatus, reason }
    );

    this.saveState(this.state);
    return this.getTransaction(id)!;
  }

  public getTransactionAuditLogs(transactionId?: string): TransactionAuditLog[] {
    if (transactionId) {
      return this.state.transactionAuditLogs.filter(
        (l) => l.transaction_id === transactionId || l.reference_id === transactionId
      );
    }
    return this.state.transactionAuditLogs;
  }

  public getFinancialSummary(): FinancialSummary {
    let totalGmv = 0;
    let settledVol = 0;
    let platformRev = 0;
    let pendingPayouts = 0;
    let refundedVol = 0;
    let settledCount = 0;
    let pendingCount = 0;
    let disputedCount = 0;
    let refundedCount = 0;

    for (const tx of this.state.transactions) {
      totalGmv += tx.amount_cents;
      if (tx.status === 'settled') {
        settledVol += tx.amount_cents;
        platformRev += tx.fee_cents;
        settledCount++;
      } else if (tx.status === 'pending') {
        pendingPayouts += tx.payout_cents;
        pendingCount++;
      } else if (tx.status === 'disputed') {
        disputedCount++;
      } else if (tx.status === 'refunded') {
        refundedVol += tx.amount_cents;
        refundedCount++;
      }
    }

    const totalTransactions = this.state.transactions.length;
    const averageOrderValueCents =
      totalTransactions > 0 ? Math.round(totalGmv / totalTransactions) : 0;

    return {
      totalGmvCents: totalGmv,
      settledVolumeCents: settledVol,
      platformRevenueCents: platformRev,
      pendingPayoutsCents: pendingPayouts,
      refundedVolumeCents: refundedVol,
      totalTransactions,
      settledCount,
      pendingCount,
      disputedCount,
      refundedCount,
      averageOrderValueCents,
    };
  }

  // --- REVIEWS & RATINGS ---
  public getBusinessReviews(businessId: string): BusinessReview[] {
    return (this.state.reviews || [])
      .filter((r) => r.business_id === businessId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public addBusinessReview(data: Omit<BusinessReview, 'id' | 'created_at' | 'updated_at'>): BusinessReview {
    const now = new Date().toISOString();
    const newReview: BusinessReview = {
      ...data,
      id: 'rev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      helpful_votes: 0,
      helpful_user_ids: [],
      created_at: now,
      updated_at: now,
    };
    if (!this.state.reviews) this.state.reviews = [];
    this.state.reviews.unshift(newReview);
    this.saveState(this.state);
    this.logActivity(newReview.user_id, 'review_added', 'reviews', newReview.id, null, newReview);
    return newReview;
  }

  public voteReviewHelpful(reviewId: string, userId: string): { helpful_votes: number; userVoted: boolean } {
    if (!this.state.reviews) this.state.reviews = [];
    const rev = this.state.reviews.find((r) => r.id === reviewId);
    if (!rev) return { helpful_votes: 0, userVoted: false };

    const voters = rev.helpful_user_ids || [];
    const idx = voters.indexOf(userId);
    let userVoted = false;

    if (idx >= 0) {
      voters.splice(idx, 1);
      rev.helpful_votes = Math.max(0, (rev.helpful_votes || 1) - 1);
      userVoted = false;
    } else {
      voters.push(userId);
      rev.helpful_votes = (rev.helpful_votes || 0) + 1;
      userVoted = true;
    }

    rev.helpful_user_ids = voters;
    this.saveState(this.state);
    return { helpful_votes: rev.helpful_votes, userVoted };
  }

  public deleteBusinessReview(reviewId: string, userId: string): boolean {
    if (!this.state.reviews) return false;
    const revIndex = this.state.reviews.findIndex((r) => r.id === reviewId && r.user_id === userId);
    if (revIndex === -1) return false;
    const removed = this.state.reviews.splice(revIndex, 1)[0];
    this.saveState(this.state);
    this.logActivity(userId, 'review_deleted', 'reviews', reviewId, removed, null);
    return true;
  }

  // --- SEARCH AUTO-SUGGESTIONS ---
  public getSearchAutoSuggestions(query: string, currentUserId?: string): SearchAutoSuggestion[] {
    const trimmed = (query || '').toLowerCase().trim();
    const suggestions: SearchAutoSuggestion[] = [];
    const profiles = this.getAllProfiles(currentUserId);

    // If query is empty, return popular / trending recommendations
    if (!trimmed) {
      suggestions.push(
        {
          id: 'sug_pop_1',
          type: 'query',
          title: '☕ Specialty Coffee in Kololo & Nakasero',
          subtitle: 'Bugisu Arabica roasters, Chemex & espresso',
          query: 'coffee',
          category: 'coffee',
        },
        {
          id: 'sug_pop_2',
          type: 'query',
          title: '🎪 Live Events & Weekend Pop-ups',
          subtitle: 'Bugolobi vinyl market & acoustic sessions',
          query: 'events',
          category: 'events',
        },
        {
          id: 'sug_pop_3',
          type: 'query',
          title: '🍽️ Lake Victoria Tilapia & Garden Dining',
          subtitle: 'Acacia canopy dining & local gastronomy',
          query: 'restaurants',
          category: 'restaurants',
        },
        {
          id: 'sug_pop_4',
          type: 'query',
          title: '🌿 Creative Hangouts & Studios',
          subtitle: 'Design Hub & 32° East contemporary arts',
          query: 'hangouts',
          category: 'hangouts',
        }
      );

      // Top rated venues in Uganda / Kampala
      const topVenues = profiles
        .filter((p) => p.country === 'UG' && (p.rating || 0) >= 4.5)
        .slice(0, 3);
      for (const v of topVenues) {
        suggestions.push({
          id: 'sug_venue_' + v.id,
          type: 'business',
          title: v.business_name,
          subtitle: `${v.category.toUpperCase()} • ${v.location || v.city || 'Kampala'} (★ ${v.rating?.toFixed(1) || '5.0'})`,
          category: v.category,
          district: v.district,
          avatar_url: v.avatar_url,
          rating: v.rating || 5.0,
          query: v.business_name,
        });
      }

      return suggestions;
    }

    // Matching businesses
    const matchingProfiles = profiles.filter((p) =>
      p.business_name.toLowerCase().includes(trimmed) ||
      p.category.toLowerCase().includes(trimmed) ||
      (p.location && p.location.toLowerCase().includes(trimmed)) ||
      (p.city && p.city.toLowerCase().includes(trimmed))
    );

    for (const p of matchingProfiles.slice(0, 4)) {
      suggestions.push({
        id: 'sug_p_' + p.id,
        type: 'business',
        title: p.business_name,
        subtitle: `${p.category} • ${p.location || p.city || 'Kampala'} (★ ${p.rating?.toFixed(1) || '5.0'})`,
        category: p.category,
        district: p.district,
        avatar_url: p.avatar_url,
        rating: p.rating || 5.0,
        query: p.business_name,
        highlightMatch: trimmed,
      });
    }

    // Matching categories
    const categoriesList = [
      { id: 'coffee', name: '☕ Coffee & Roasters', query: 'coffee' },
      { id: 'events', name: '🎪 Events & Pop-ups', query: 'events' },
      { id: 'hangouts', name: '🌿 Hangouts & Creative Spaces', query: 'hangouts' },
      { id: 'restaurants', name: '🍽️ Restaurants & Dining', query: 'restaurants' },
      { id: 'bakery', name: '🥐 Bakery & Pastry', query: 'bakery' },
      { id: 'crafts', name: '🏺 Ceramics & Pottery', query: 'crafts' },
      { id: 'leather', name: '🧵 Leather & Tailoring', query: 'leather' },
    ];

    const matchingCats = categoriesList.filter((c) =>
      c.name.toLowerCase().includes(trimmed) || c.id.includes(trimmed)
    );

    for (const c of matchingCats.slice(0, 2)) {
      suggestions.push({
        id: 'sug_cat_' + c.id,
        type: 'category',
        title: c.name,
        subtitle: `Explore all ${c.id} venues & showcases`,
        category: c.id,
        query: c.query,
        highlightMatch: trimmed,
      });
    }

    // Matching districts
    const ugDistricts = [
      { id: 'ug_kololo', name: 'Kololo, Kampala', desc: 'Specialty roasters & lush garden dining' },
      { id: 'ug_bugolobi', name: 'Bugolobi, Kampala', desc: 'Design Hub, vinyl sundowners & artisan markets' },
      { id: 'ug_nakasero', name: 'Nakasero, Kampala', desc: 'Bugisu Arabica coffee shrines & central dining' },
      { id: 'ug_muyenga', name: 'Muyenga & Ggaba', desc: 'Tank Hill lakeview lounges & 32° East Arts' },
      { id: 'ug_kampala_central', name: 'Kampala Central', desc: 'Historic cafes, meeting spots & bistros' },
      { id: 'ug_entebbe', name: 'Entebbe Peninsula', desc: 'Lake Victoria botanical gardens & waterfront' },
      { id: 'ug_jinja', name: 'Jinja (Source of Nile)', desc: 'Adventure lodges & craft cooperatives' },
    ].filter((d) => d.name.toLowerCase().includes(trimmed) || d.desc.toLowerCase().includes(trimmed));

    for (const d of ugDistricts.slice(0, 2)) {
      suggestions.push({
        id: 'sug_dist_' + d.id,
        type: 'district',
        title: `📍 ${d.name}`,
        subtitle: d.desc,
        district: d.id,
        query: d.name,
        highlightMatch: trimmed,
      });
    }

    return suggestions.slice(0, 8);
  }

  // --- USER FEEDBACK SURVEYS ---
  public getBusinessSurvey(businessId: string): FeedbackSurvey | null {
    if (!this.state.surveys) this.state.surveys = [...INITIAL_SURVEYS];
    return this.state.surveys.find((s) => s.business_id === businessId && s.is_active) || null;
  }

  public saveBusinessSurvey(data: {
    id?: string;
    business_id: string;
    question: string;
    category?: string;
    options: Array<{ id?: string; text: string; votes?: number }>;
  }): FeedbackSurvey {
    if (!this.state.surveys) this.state.surveys = [...INITIAL_SURVEYS];

    // Deactivate existing surveys for this business
    this.state.surveys = this.state.surveys.map((s) =>
      s.business_id === data.business_id ? { ...s, is_active: false } : s
    );

    const surveyId = data.id || `survey_${Date.now()}`;
    const newSurvey: FeedbackSurvey = {
      id: surveyId,
      business_id: data.business_id,
      question: data.question,
      category: data.category || 'Future Product Survey',
      options: data.options.map((opt, idx) => ({
        id: opt.id || `opt_${idx + 1}_${Date.now()}`,
        text: opt.text,
        votes: opt.votes || 0,
      })),
      total_votes: data.options.reduce((sum, o) => sum + (o.votes || 0), 0),
      voter_user_ids: {},
      is_active: true,
      created_at: new Date().toISOString(),
    };

    this.state.surveys.unshift(newSurvey);
    this.saveState(this.state);
    return newSurvey;
  }

  public voteBusinessSurvey(surveyId: string, optionId: string, userId: string): FeedbackSurvey | null {
    if (!this.state.surveys) this.state.surveys = [...INITIAL_SURVEYS];
    const survey = this.state.surveys.find((s) => s.id === surveyId);
    if (!survey) return null;

    if (!survey.voter_user_ids) survey.voter_user_ids = {};
    const previousVote = survey.voter_user_ids[userId];

    // If changing vote, subtract from previous
    if (previousVote) {
      const prevOpt = survey.options.find((o) => o.id === previousVote);
      if (prevOpt && prevOpt.votes > 0) prevOpt.votes -= 1;
    } else {
      survey.total_votes += 1;
    }

    const currentOpt = survey.options.find((o) => o.id === optionId);
    if (currentOpt) {
      currentOpt.votes += 1;
    }

    survey.voter_user_ids[userId] = optionId;
    this.saveState(this.state);
    return { ...survey };
  }

  public closeBusinessSurvey(surveyId: string): boolean {
    if (!this.state.surveys) return false;
    const survey = this.state.surveys.find((s) => s.id === surveyId);
    if (!survey) return false;
    survey.is_active = false;
    this.saveState(this.state);
    return true;
  }

  public deleteBusinessSurvey(surveyId: string): boolean {
    if (!this.state.surveys) return false;
    this.state.surveys = this.state.surveys.filter((s) => s.id !== surveyId);
    this.saveState(this.state);
    return true;
  }

  // --- BUSINESS ONBOARDING TOUR RETENTION ---
  public getUserTourRecord(userId: string): OnboardingTourRecord {
    if (!this.state.onboardingTours) this.state.onboardingTours = [];
    let record = this.state.onboardingTours.find((r) => r.user_id === userId);
    if (!record) {
      record = {
        user_id: userId,
        is_completed: false,
        current_step: 0,
        updated_at: new Date().toISOString(),
      };
      this.state.onboardingTours.push(record);
      this.saveState(this.state);
    }
    return record;
  }

  public saveUserTourProgress(
    userId: string,
    currentStep: number,
    isCompleted: boolean
  ): OnboardingTourRecord {
    if (!this.state.onboardingTours) this.state.onboardingTours = [];
    let record = this.state.onboardingTours.find((r) => r.user_id === userId);
    const now = new Date().toISOString();

    if (record) {
      record.current_step = currentStep;
      record.is_completed = isCompleted;
      if (isCompleted && !record.completed_at) {
        record.completed_at = now;
      }
      record.updated_at = now;
    } else {
      record = {
        user_id: userId,
        is_completed: isCompleted,
        current_step: currentStep,
        completed_at: isCompleted ? now : undefined,
        updated_at: now,
      };
      this.state.onboardingTours.push(record);
    }

    // Update profile cache
    const profile = this.state.profiles.find((p) => p.id === userId);
    if (profile) {
      profile.has_completed_tour = isCompleted;
      profile.tour_step = currentStep;
      if (isCompleted) profile.tour_completed_at = now;
    }

    this.logActivity(
      userId,
      isCompleted ? 'completed_onboarding_tour' : 'updated_tour_progress',
      'user_tour',
      userId,
      { step: currentStep, isCompleted }
    );

    this.saveState(this.state);
    return record;
  }

  public resetUserTour(userId: string): void {
    if (!this.state.onboardingTours) this.state.onboardingTours = [];
    const record = this.state.onboardingTours.find((r) => r.user_id === userId);
    if (record) {
      record.is_completed = false;
      record.current_step = 0;
      record.completed_at = undefined;
      record.updated_at = new Date().toISOString();
    }
    const profile = this.state.profiles.find((p) => p.id === userId);
    if (profile) {
      profile.has_completed_tour = false;
      profile.tour_step = 0;
      profile.tour_completed_at = undefined;
    }
    this.saveState(this.state);
  }

  // --- DELETE ACCOUNT ---
  public deleteUserAccount(userId: string): boolean {
    this.state.posts = this.state.posts.filter((p) => p.user_id !== userId);
    this.state.follows = this.state.follows.filter((f) => f.follower_id !== userId && f.following_id !== userId);
    this.state.blocks = this.state.blocks.filter((b) => b.blocker_id !== userId && b.blocked_id !== userId);
    this.state.comments = this.state.comments.filter((c) => c.user_id !== userId);
    this.state.messages = this.state.messages.filter((m) => m.sender_id !== userId && m.recipient_id !== userId);
    this.state.profiles = this.state.profiles.filter((p) => p.id !== userId);
    this.saveState(this.state);
    return true;
  }
}

export const db = new LocalDatabase();
