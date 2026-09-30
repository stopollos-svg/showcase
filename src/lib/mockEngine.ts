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
} from '../types';

const DB_STORAGE_KEY = 'amapati_db_v4';

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
}

const INITIAL_PROFILES: Profile[] = [
  {
    id: 'user_coffee',
    business_name: 'Bella Terra Roasters',
    bio: 'Micro-batch single-origin coffees roasted weekly over cast iron. Ethically sourced from shade-grown highland farms.',
    category: 'Coffee & Roasting',
    contact: '+1 (555) 382-9901',
    avatar_url: '/src/assets/images/coffee_roaster_1790587302699.jpg',
    is_private: false,
    is_verified: true,
    created_at: '2026-09-20T08:00:00Z',
    updated_at: '2026-09-20T08:00:00Z',
  },
  {
    id: 'user_ceramics',
    business_name: 'Nadia Studio Ceramics',
    bio: 'Slow-crafted stoneware and functional tableware glazed with natural wood ash. Hand-thrown in our sunny courtyard workshop.',
    category: 'Ceramics & Pottery',
    contact: 'hello@nadiastudio.craft',
    avatar_url: '/src/assets/images/ceramic_studio_1790587319737.jpg',
    is_private: false,
    is_verified: true,
    created_at: '2026-09-21T09:30:00Z',
    updated_at: '2026-09-21T09:30:00Z',
  },
  {
    id: 'user_bakery',
    business_name: 'Levain & Crust Bakery',
    bio: '36-hour cold-fermented wild sourdough, morning cardamom buns, and seasonal stone-fruit galettes. Baked fresh before sunrise.',
    category: 'Bakery & Pastry',
    contact: 'order@levaincrust.com',
    avatar_url: '/src/assets/images/bakery_pastry_1790587333429.jpg',
    is_private: false,
    is_verified: false,
    created_at: '2026-09-22T05:00:00Z',
    updated_at: '2026-09-22T05:00:00Z',
  },
  {
    id: 'user_leather',
    business_name: 'Sartoria Bespoke Goods',
    bio: 'Hand-stitched vegetable-tanned leather totes, briefcases, and brass-buckled belts. Built with heirloom durability.',
    category: 'Leather & Tailoring',
    contact: '+1 (555) 891-2300',
    avatar_url: '/src/assets/images/leather_tailor_1790587348791.jpg',
    is_private: false,
    is_verified: false,
    created_at: '2026-09-23T11:15:00Z',
    updated_at: '2026-09-23T11:15:00Z',
  },
  {
    id: 'user_admin',
    business_name: 'Amapati Staff & Trust',
    bio: 'Official Amapati community moderation and business verification team.',
    category: 'Creative Services',
    contact: 'trust@amapati.app',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    is_private: false,
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
      };
    }

    try {
      const raw = localStorage.getItem(DB_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          profiles: parsed.profiles || INITIAL_PROFILES,
          posts: parsed.posts || INITIAL_POSTS,
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
    sort?: 'latest' | 'popular' | 'trending';
  } = {}): Post[] {
    const { viewerId, userId, feedType = 'following', category, searchQuery, sort } = options;

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

    if (category && category !== 'all') {
      const categoryProfiles = this.state.profiles
        .filter((pr) => pr.category.toLowerCase().includes(category.toLowerCase()))
        .map((pr) => pr.id);
      filtered = filtered.filter((p) => categoryProfiles.includes(p.user_id));
    }

    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((p) => {
        const author = this.state.profiles.find((pr) => pr.id === p.user_id);
        return (
          p.caption.toLowerCase().includes(q) ||
          author?.business_name.toLowerCase().includes(q) ||
          author?.category.toLowerCase().includes(q)
        );
      });
    }

    // DISCOVER FEED RANKING
    if (feedType === 'discover' && !userId) {
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
        if (diverseSlots.length < 20) {
          if (count < 2) {
            diverseSlots.push(p);
            authorSlotCount[p.user_id] = count + 1;
          } else {
            deferredSlots.push(p);
          }
        } else {
          deferredSlots.push(p);
        }
      }

      filtered = [...diverseSlots, ...deferredSlots];
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
      return {
        ...post,
        like_count: post.like_count ?? post.likes_count ?? 0,
        comment_count: commentsCount,
        comments_count: commentsCount,
        view_count: post.view_count || 0,
        share_count: post.share_count || 0,
        save_count: post.save_count || 0,
        trending_score: post.trending_score || 0,
        user: author || undefined,
      };
    });
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

  public softDeletePost(postId: string, userId: string): boolean {
    const postIndex = this.state.posts.findIndex((p) => p.id === postId);
    if (postIndex === -1) return false;
    const existing = this.state.posts[postIndex];

    if (existing.user_id !== userId) {
      throw new Error('RLS Violation: You can only delete your own posts.');
    }

    existing.is_deleted = true;
    existing.updated_at = new Date().toISOString();
    this.saveState(this.state);
    this.logActivity(userId, 'post_deleted', 'posts', postId, existing, { is_deleted: true });
    return true;
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
