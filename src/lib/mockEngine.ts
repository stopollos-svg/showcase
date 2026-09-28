import { ActivityLog, Block, Follow, FollowStatus, Post, Profile, Report } from '../types';

const DB_STORAGE_KEY = 'amapati_db_v2';

export interface DatabaseState {
  profiles: Profile[];
  posts: Post[];
  follows: Follow[];
  blocks: Block[];
  reports: Report[];
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
    created_at: '2026-09-23T11:15:00Z',
    updated_at: '2026-09-23T11:15:00Z',
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
  },
  {
    id: 'post_3',
    user_id: 'user_bakery',
    media_type: 'video',
    // High quality sample MP4 video for smooth inline autoplay testing
    media_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnail_url: '/src/assets/images/bakery_pastry_1790587333429.jpg',
    caption: 'Morning crust check! Listen to that singing crackle right out of the hearth oven. 80% hydration country loaf with stoneground spelt.',
    duration: 15,
    is_deleted: false,
    created_at: '2026-09-27T14:20:00Z',
    updated_at: '2026-09-27T14:20:00Z',
    likes_count: 129,
  },
  {
    id: 'post_4',
    user_id: 'user_leather',
    media_type: 'audio',
    // Ambient sound clip for audio player demonstration
    media_url: 'https://actions.google.com/sounds/v1/tools/handsaw_cutting_wood.ogg',
    thumbnail_url: '/src/assets/images/leather_tailor_1790587348791.jpg',
    caption: 'Workshop Sounds Episode 4: Beveling and burnishing the edge of our full-grain leather field bag using organic beeswax and wooden slicker.',
    duration: 48,
    is_deleted: false,
    created_at: '2026-09-26T20:10:00Z',
    updated_at: '2026-09-26T20:10:00Z',
    likes_count: 36,
  },
  {
    id: 'post_5',
    user_id: 'user_bakery',
    media_type: 'image',
    media_url: '/src/assets/images/bakery_pastry_1790587333429.jpg',
    caption: 'Laminated layers on this morning\'s cultured butter croissants. 27 delicate folds and 100% Normandy butter.',
    is_deleted: false,
    created_at: '2026-09-26T07:15:00Z',
    updated_at: '2026-09-26T07:15:00Z',
    likes_count: 94,
  },
  {
    id: 'post_6',
    user_id: 'user_leather',
    media_type: 'image',
    media_url: '/src/assets/images/leather_tailor_1790587348791.jpg',
    caption: 'Completed custom briefcase for a local architect. Hand-stitched with waxed Irish linen thread and solid antique brass lockwork.',
    is_deleted: false,
    created_at: '2026-09-25T16:00:00Z',
    updated_at: '2026-09-25T16:00:00Z',
    likes_count: 77,
  },
];

const INITIAL_FOLLOWS: Follow[] = [
  { follower_id: 'user_coffee', following_id: 'user_ceramics', status: 'accepted', created_at: '2026-09-22T10:00:00Z' },
  { follower_id: 'user_ceramics', following_id: 'user_bakery', status: 'accepted', created_at: '2026-09-23T11:00:00Z' },
  { follower_id: 'user_bakery', following_id: 'user_coffee', status: 'accepted', created_at: '2026-09-24T12:00:00Z' },
  { follower_id: 'user_leather', following_id: 'user_coffee', status: 'accepted', created_at: '2026-09-25T13:00:00Z' },
];

const INITIAL_LOGS: ActivityLog[] = [
  {
    id: 'log_init_1',
    user_id: 'user_coffee',
    action: 'signup',
    entity_type: 'profiles',
    entity_id: 'user_coffee',
    old_data: null,
    new_data: { business_name: 'Bella Terra Roasters', category: 'Coffee & Roasting' },
    created_at: '2026-09-20T08:00:00Z',
  },
  {
    id: 'log_init_2',
    user_id: 'user_coffee',
    action: 'post_created',
    entity_type: 'posts',
    entity_id: 'post_1',
    old_data: null,
    new_data: { media_type: 'image', caption: 'First batch of the morning...' },
    created_at: '2026-09-28T01:30:00Z',
  },
  {
    id: 'log_init_3',
    user_id: 'user_bakery',
    action: 'post_created',
    entity_type: 'posts',
    entity_id: 'post_3',
    old_data: null,
    new_data: { media_type: 'video', caption: 'Morning crust check...' },
    created_at: '2026-09-27T14:20:00Z',
  },
];

class LocalDatabase {
  private state: DatabaseState;

  constructor() {
    this.state = this.load();
  }

  private load(): DatabaseState {
    if (typeof window === 'undefined') {
      return {
        profiles: INITIAL_PROFILES,
        posts: INITIAL_POSTS,
        follows: INITIAL_FOLLOWS,
        blocks: [],
        reports: [],
        activityLogs: INITIAL_LOGS,
      };
    }

    try {
      const stored = localStorage.getItem(DB_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse stored local database:', e);
    }

    const initial: DatabaseState = {
      profiles: INITIAL_PROFILES,
      posts: INITIAL_POSTS,
      follows: INITIAL_FOLLOWS,
      blocks: [],
      reports: [],
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
      follows: [...INITIAL_FOLLOWS],
      blocks: [],
      reports: [],
      activityLogs: [...INITIAL_LOGS],
    };
    this.saveState(this.state);
  }

  // --- AUTOMATIC APPEND-ONLY ACTIVITY LOG TRIGGER SIMULATION ---
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
    const p = this.state.profiles.find((x) => x.id === id);
    if (!p) return null;

    // Check block list: if either has blocked the other, hide
    if (viewerId && this.isBlocked(viewerId, id)) {
      return null;
    }

    const followersCount = this.state.follows.filter((f) => f.following_id === id && f.status === 'accepted').length;
    const followingCount = this.state.follows.filter((f) => f.follower_id === id && f.status === 'accepted').length;
    const postsCount = this.state.posts.filter((post) => post.user_id === id && !post.is_deleted).length;

    let isFollowing = false;
    let followStatus: 'pending' | 'accepted' | 'none' = 'none';

    if (viewerId && viewerId !== id) {
      const rel = this.state.follows.find((f) => f.follower_id === viewerId && f.following_id === id);
      if (rel) {
        isFollowing = rel.status === 'accepted';
        followStatus = rel.status;
      }
    }

    return {
      ...p,
      followers_count: followersCount,
      following_count: followingCount,
      posts_count: postsCount,
      is_following: isFollowing,
      follow_status: followStatus,
    };
  }

  public getAllProfiles(viewerId?: string): Profile[] {
    return this.state.profiles
      .filter((p) => !viewerId || !this.isBlocked(viewerId, p.id))
      .map((p) => this.getProfile(p.id, viewerId)!)
      .filter(Boolean);
  }

  public createOrUpdateProfile(profile: Partial<Profile> & { id: string }): Profile {
    const existingIndex = this.state.profiles.findIndex((p) => p.id === profile.id);
    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      const old = this.state.profiles[existingIndex];
      const updated: Profile = {
        ...old,
        ...profile,
        updated_at: now,
      };
      this.state.profiles[existingIndex] = updated;
      this.saveState(this.state);
      this.logActivity(profile.id, 'profile_updated', 'profiles', profile.id, old, updated);
      return updated;
    } else {
      const created: Profile = {
        id: profile.id,
        business_name: profile.business_name || 'My Artisan Business',
        bio: profile.bio || '',
        category: profile.category || 'General Business',
        contact: profile.contact || '',
        avatar_url: profile.avatar_url || '',
        is_private: Boolean(profile.is_private),
        created_at: now,
        updated_at: now,
      };
      this.state.profiles.push(created);
      this.saveState(this.state);
      this.logActivity(profile.id, 'signup', 'profiles', profile.id, null, created);
      return created;
    }
  }

  // --- POSTS ---
  public getPosts(options: {
    viewerId?: string;
    feedType?: 'following' | 'discover';
    userId?: string;
    category?: string;
    searchQuery?: string;
  }): Post[] {
    const { viewerId, feedType = 'discover', userId, category, searchQuery } = options;

    return this.state.posts
      .filter((post) => {
        // Soft delete check
        if (post.is_deleted) return false;

        // Block check between viewer and creator
        if (viewerId && this.isBlocked(viewerId, post.user_id)) {
          return false;
        }

        const author = this.state.profiles.find((p) => p.id === post.user_id);
        if (!author) return false;

        // Specific user profile view
        if (userId && post.user_id !== userId) return false;

        // Following feed filter
        if (feedType === 'following') {
          if (!viewerId) return false;
          // Must follow this author with accepted status or be own post
          const isFollowing = this.state.follows.some(
            (f) => f.follower_id === viewerId && f.following_id === post.user_id && f.status === 'accepted'
          );
          if (!isFollowing && post.user_id !== viewerId) return false;
        }

        // Private account visibility rule:
        // If private, only owner and accepted followers can see posts
        if (author.is_private && (!viewerId || (viewerId !== author.id && !this.isFollowing(viewerId, author.id)))) {
          return false;
        }

        // Category filter (Discover tab)
        if (category && category !== 'all') {
          const matchCat = author.category.toLowerCase().includes(category.toLowerCase());
          if (!matchCat) return false;
        }

        // Search query filter (business name or caption)
        if (searchQuery && searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim();
          const matchCaption = post.caption.toLowerCase().includes(query);
          const matchName = author.business_name.toLowerCase().includes(query);
          const matchCategory = author.category.toLowerCase().includes(query);
          if (!matchCaption && !matchName && !matchCategory) return false;
        }

        return true;
      })
      .map((post) => ({
        ...post,
        user: this.getProfile(post.user_id, viewerId) || undefined,
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public createPost(data: Omit<Post, 'id' | 'created_at' | 'updated_at' | 'is_deleted'>): Post {
    const now = new Date().toISOString();
    const newPost: Post = {
      ...data,
      id: 'post_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      is_deleted: false,
      created_at: now,
      updated_at: now,
      likes_count: 0,
    };
    this.state.posts.unshift(newPost);
    this.saveState(this.state);
    this.logActivity(data.user_id, 'post_created', 'posts', newPost.id, null, newPost);
    return {
      ...newPost,
      user: this.getProfile(data.user_id) || undefined,
    };
  }

  public updatePost(postId: string, userId: string, updates: Partial<Post>): Post {
    const index = this.state.posts.findIndex((p) => p.id === postId && p.user_id === userId);
    if (index === -1) {
      throw new Error('Post not found or unauthorized to update.');
    }
    const old = this.state.posts[index];
    const now = new Date().toISOString();
    const updated: Post = {
      ...old,
      ...updates,
      updated_at: now,
    };
    this.state.posts[index] = updated;
    this.saveState(this.state);

    if (old.is_deleted === false && updated.is_deleted === true) {
      this.logActivity(userId, 'post_deleted', 'posts', postId, old, updated);
    } else {
      this.logActivity(userId, 'post_edited', 'posts', postId, old, updated);
    }

    return updated;
  }

  public softDeletePost(postId: string, userId: string): boolean {
    const post = this.state.posts.find((p) => p.id === postId && p.user_id === userId);
    if (!post) return false;
    this.updatePost(postId, userId, { is_deleted: true });
    return true;
  }

  // --- FOLLOWS ---
  public followUser(followerId: string, followingId: string): FollowStatus {
    if (followerId === followingId) throw new Error('Cannot follow yourself.');
    if (this.isBlocked(followerId, followingId)) throw new Error('Action blocked.');

    const targetProfile = this.state.profiles.find((p) => p.id === followingId);
    const status: 'pending' | 'accepted' = targetProfile?.is_private ? 'pending' : 'accepted';

    const existingIndex = this.state.follows.findIndex(
      (f) => f.follower_id === followerId && f.following_id === followingId
    );

    const now = new Date().toISOString();
    const followObj: Follow = {
      follower_id: followerId,
      following_id: followingId,
      status,
      created_at: now,
    };

    if (existingIndex >= 0) {
      this.state.follows[existingIndex] = followObj;
    } else {
      this.state.follows.push(followObj);
    }

    this.saveState(this.state);
    this.logActivity(followerId, 'followed', 'follows', followingId, null, followObj);
    return status;
  }

  public unfollowUser(followerId: string, followingId: string): boolean {
    const index = this.state.follows.findIndex(
      (f) => f.follower_id === followerId && f.following_id === followingId
    );
    if (index === -1) return false;

    const old = this.state.follows[index];
    this.state.follows.splice(index, 1);
    this.saveState(this.state);
    this.logActivity(followerId, 'unfollowed', 'follows', followingId, old, null);
    return true;
  }

  /**
   * Profile owner removes a follower from their followers list!
   */
  public removeFollower(ownerId: string, followerIdToRemove: string): boolean {
    const index = this.state.follows.findIndex(
      (f) => f.following_id === ownerId && f.follower_id === followerIdToRemove
    );
    if (index === -1) return false;

    const old = this.state.follows[index];
    this.state.follows.splice(index, 1);
    this.saveState(this.state);
    this.logActivity(ownerId, 'follower_removed', 'follows', followerIdToRemove, old, null);
    return true;
  }

  public approveFollowRequest(ownerId: string, followerId: string): boolean {
    const rel = this.state.follows.find((f) => f.following_id === ownerId && f.follower_id === followerId);
    if (!rel) return false;

    rel.status = 'accepted';
    this.saveState(this.state);
    this.logActivity(ownerId, 'follow_status_updated', 'follows', followerId, { status: 'pending' }, { status: 'accepted' });
    return true;
  }

  public getFollowers(profileId: string, viewerId?: string): Profile[] {
    const followerIds = this.state.follows
      .filter((f) => f.following_id === profileId && f.status === 'accepted')
      .map((f) => f.follower_id);

    return followerIds
      .map((id) => this.getProfile(id, viewerId))
      .filter((p): p is Profile => Boolean(p));
  }

  public getFollowRequests(ownerId: string): Profile[] {
    const requestIds = this.state.follows
      .filter((f) => f.following_id === ownerId && f.status === 'pending')
      .map((f) => f.follower_id);

    return requestIds
      .map((id) => this.getProfile(id, ownerId))
      .filter((p): p is Profile => Boolean(p));
  }

  public getFollowing(profileId: string, viewerId?: string): Profile[] {
    const followingIds = this.state.follows
      .filter((f) => f.follower_id === profileId && f.status === 'accepted')
      .map((f) => f.following_id);

    return followingIds
      .map((id) => this.getProfile(id, viewerId))
      .filter((p): p is Profile => Boolean(p));
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

    // Also remove any follow links between them
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
  public reportTarget(reporterId: string, targetType: 'post' | 'profile', targetId: string, reason: string, details?: string): Report {
    const report: Report = {
      id: 'rep_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      reporter_id: reporterId,
      target_type: targetType,
      target_id: targetId,
      reason,
      details,
      created_at: new Date().toISOString(),
    };
    this.state.reports.push(report);
    this.saveState(this.state);
    this.logActivity(reporterId, 'reported', 'reports', targetId, null, { target_type: targetType, reason });
    return report;
  }

  // --- ACTIVITY LOG (APPEND-ONLY) ---
  public getActivityLogs(userId: string): ActivityLog[] {
    return this.state.activityLogs
      .filter((log) => log.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // --- DELETE ACCOUNT ---
  public deleteUserAccount(userId: string): boolean {
    // Delete profile, posts, follows, blocks
    this.state.posts = this.state.posts.filter((p) => p.user_id !== userId);
    this.state.follows = this.state.follows.filter((f) => f.follower_id !== userId && f.following_id !== userId);
    this.state.blocks = this.state.blocks.filter((b) => b.blocker_id !== userId && b.blocked_id !== userId);
    this.state.profiles = this.state.profiles.filter((p) => p.id !== userId);
    this.saveState(this.state);
    return true;
  }
}

export const db = new LocalDatabase();
