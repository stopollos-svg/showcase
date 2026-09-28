import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../lib/mockEngine';
import { getStoredSupabaseConfig, isSupabaseConfigured, saveStoredSupabaseConfig } from '../lib/supabase';
import { ActivityLog, Post, Profile } from '../types';

interface ToastMessage {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

interface AppContextType {
  currentUser: Profile | null;
  activeTab: 'home' | 'discover' | 'profile';
  setActiveTab: (tab: 'home' | 'discover' | 'profile') => void;
  selectedProfileId: string | null;
  viewProfile: (profileId: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;

  // Auth
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  sendOtp: (type: 'email' | 'phone', value: string) => Promise<{ code: string }>;
  verifyOtp: (
    type: 'email' | 'phone',
    value: string,
    code: string,
    businessInfo?: { businessName: string; category: string; bio?: string; contact?: string; avatar_url?: string }
  ) => Promise<boolean>;
  logout: () => void;
  switchAccount: (profileId: string) => void;
  updateProfile: (updates: Partial<Profile>) => Promise<Profile>;
  deleteAccount: () => Promise<boolean>;

  // Feed & Posts
  posts: Post[];
  refreshFeed: () => void;
  createPost: (data: {
    media_type: 'image' | 'video' | 'audio';
    media_url: string;
    caption: string;
    duration?: number;
    thumbnail_url?: string;
  }) => Promise<Post>;
  updatePost: (postId: string, updates: Partial<Post>) => Promise<Post>;
  deletePost: (postId: string) => Promise<boolean>;

  // Follow
  followUser: (targetId: string) => Promise<void>;
  unfollowUser: (targetId: string) => Promise<void>;
  removeFollower: (followerId: string) => Promise<void>;
  approveFollowRequest: (followerId: string) => Promise<void>;

  // Safety
  blockUser: (targetId: string) => Promise<void>;
  unblockUser: (targetId: string) => Promise<void>;
  reportTarget: (type: 'post' | 'profile', targetId: string, reason: string, details?: string) => Promise<void>;
  getActivityLogs: () => ActivityLog[];

  // Modals & UI
  isCreateModalOpen: boolean;
  openCreateModal: () => void;
  closeCreateModal: () => void;
  isEditProfileModalOpen: boolean;
  setEditProfileModalOpen: (open: boolean) => void;
  isSettingsModalOpen: boolean;
  setSettingsModalOpen: (open: boolean) => void;
  isAccountSwitcherModalOpen: boolean;
  setAccountSwitcherModalOpen: (open: boolean) => void;
  isActivityLogModalOpen: boolean;
  setActivityLogModalOpen: (open: boolean) => void;
  isSupabaseModalOpen: boolean;
  setSupabaseModalOpen: (open: boolean) => void;

  toasts: ToastMessage[];
  showToast: (message: string, type?: 'info' | 'success' | 'error') => void;
  dismissToast: (id: string) => void;

  supabaseConfig: { url: string; key: string };
  updateSupabaseConfig: (url: string, key: string) => void;
  isSupabaseLive: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const CURRENT_USER_STORAGE_KEY = 'amapati_current_user_id_v2';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'discover' | 'profile'>('home');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [posts, setPosts] = useState<Post[]>([]);

  // Modals
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isEditProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
  const [isAccountSwitcherModalOpen, setAccountSwitcherModalOpen] = useState(false);
  const [isActivityLogModalOpen, setActivityLogModalOpen] = useState(false);
  const [isSupabaseModalOpen, setSupabaseModalOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Supabase status
  const [supabaseConfig, setSupabaseConfigState] = useState(getStoredSupabaseConfig());
  const [isSupabaseLive, setIsSupabaseLive] = useState(isSupabaseConfigured());

  const showToast = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const id = 'toast_' + Date.now() + Math.random().toString(36).slice(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Initialize Session: Load stored user or default to Bella Terra Roasters demo login
  useEffect(() => {
    const storedId = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
    if (storedId) {
      const profile = db.getProfile(storedId);
      if (profile) {
        setCurrentUser(profile);
      } else {
        // Fallback demo account
        const demo = db.getProfile('user_coffee');
        if (demo) setCurrentUser(demo);
      }
    } else {
      // First visit: log into demo artisan account so user immediately experiences the platform
      const demo = db.getProfile('user_coffee');
      if (demo) {
        setCurrentUser(demo);
        localStorage.setItem(CURRENT_USER_STORAGE_KEY, demo.id);
      }
    }
  }, []);

  // Refresh feeds
  const refreshFeed = () => {
    const feed = db.getPosts({
      viewerId: currentUser?.id,
      feedType: activeTab === 'home' ? 'following' : 'discover',
      category: activeTab === 'discover' ? selectedCategory : undefined,
      searchQuery: activeTab === 'discover' ? searchQuery : undefined,
    });
    setPosts(feed);

    // Refresh current user counts
    if (currentUser) {
      const refreshed = db.getProfile(currentUser.id);
      if (refreshed) setCurrentUser(refreshed);
    }
  };

  useEffect(() => {
    refreshFeed();
  }, [activeTab, selectedCategory, searchQuery, currentUser?.id]);

  const viewProfile = (profileId: string) => {
    setSelectedProfileId(profileId);
    setActiveTab('profile');
  };

  // Auth functions
  const sendOtp = async (_type: 'email' | 'phone', _value: string): Promise<{ code: string }> => {
    // Deterministic 6-digit test code for seamless testing
    const code = '123456';
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ code });
      }, 500);
    });
  };

  const verifyOtp = async (
    type: 'email' | 'phone',
    value: string,
    code: string,
    businessInfo?: { businessName: string; category: string; bio?: string; contact?: string; avatar_url?: string }
  ): Promise<boolean> => {
    if (code !== '123456' && code.length !== 6) {
      showToast('Invalid verification code. Use 123456.', 'error');
      return false;
    }

    // Check if profile exists for this identifier
    const userId = 'usr_' + value.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    let profile = db.getProfile(userId);

    if (!profile) {
      profile = db.createOrUpdateProfile({
        id: userId,
        business_name: businessInfo?.businessName || (type === 'email' ? value.split('@')[0] : 'My Business'),
        category: businessInfo?.category || 'Craft & Artisan',
        bio: businessInfo?.bio || 'Handcrafted goods with passion.',
        contact: businessInfo?.contact || value,
        avatar_url: businessInfo?.avatar_url || '/src/assets/images/coffee_roaster_1790587302699.jpg',
        is_private: false,
      });
      showToast('Welcome to Amapati! Your business profile is ready.', 'success');
    } else {
      showToast('Welcome back, ' + profile.business_name + '!', 'success');
    }

    setCurrentUser(profile);
    localStorage.setItem(CURRENT_USER_STORAGE_KEY, profile.id);
    setAuthModalOpen(false);
    refreshFeed();
    return true;
  };

  const logout = () => {
    localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    setCurrentUser(null);
    setSelectedProfileId(null);
    showToast('Logged out of business session.');
    refreshFeed();
  };

  const switchAccount = (profileId: string) => {
    const profile = db.getProfile(profileId);
    if (!profile) {
      showToast('Account not found.', 'error');
      return;
    }
    setCurrentUser(profile);
    localStorage.setItem(CURRENT_USER_STORAGE_KEY, profile.id);
    setSelectedProfileId(null);
    showToast(`Switched active session to ${profile.business_name}!`, 'success');
    refreshFeed();
  };

  const updateProfile = async (updates: Partial<Profile>): Promise<Profile> => {
    if (!currentUser) throw new Error('Not authenticated');
    const updated = db.createOrUpdateProfile({
      ...currentUser,
      ...updates,
      id: currentUser.id,
    });
    setCurrentUser(updated);
    showToast('Profile updated.', 'success');
    refreshFeed();
    return updated;
  };

  const deleteAccount = async (): Promise<boolean> => {
    if (!currentUser) return false;
    db.deleteUserAccount(currentUser.id);
    logout();
    showToast('Account and business showcase deleted.');
    return true;
  };

  // Posts
  const createPost = async (data: {
    media_type: 'image' | 'video' | 'audio';
    media_url: string;
    caption: string;
    duration?: number;
    thumbnail_url?: string;
  }): Promise<Post> => {
    if (!currentUser) {
      setAuthModalOpen(true);
      throw new Error('Please sign in to showcase your craft.');
    }

    const newPost = db.createPost({
      user_id: currentUser.id,
      media_type: data.media_type,
      media_url: data.media_url,
      caption: data.caption,
      duration: data.duration,
      thumbnail_url: data.thumbnail_url,
    });

    showToast('Showcase post published!', 'success');
    setCreateModalOpen(false);
    setActiveTab('home');
    refreshFeed();
    return newPost;
  };

  const updatePost = async (postId: string, updates: Partial<Post>): Promise<Post> => {
    if (!currentUser) throw new Error('Not authenticated');
    const updated = db.updatePost(postId, currentUser.id, updates);
    showToast('Post updated.', 'success');
    refreshFeed();
    return updated;
  };

  const deletePost = async (postId: string): Promise<boolean> => {
    if (!currentUser) throw new Error('Not authenticated');
    const success = db.softDeletePost(postId, currentUser.id);
    if (success) {
      showToast('Post removed from feed (archived).', 'info');
      refreshFeed();
    }
    return success;
  };

  // Follows
  const followUser = async (targetId: string) => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }
    const status = db.followUser(currentUser.id, targetId);
    if (status === 'pending') {
      showToast('Follow request sent (private business account).', 'info');
    } else {
      showToast('Following business!', 'success');
    }
    refreshFeed();
  };

  const unfollowUser = async (targetId: string) => {
    if (!currentUser) return;
    db.unfollowUser(currentUser.id, targetId);
    showToast('Unfollowed business.');
    refreshFeed();
  };

  const removeFollower = async (followerId: string) => {
    if (!currentUser) return;
    db.removeFollower(currentUser.id, followerId);
    showToast('Follower removed from your list.', 'info');
    refreshFeed();
  };

  const approveFollowRequest = async (followerId: string) => {
    if (!currentUser) return;
    db.approveFollowRequest(currentUser.id, followerId);
    showToast('Follow request approved.', 'success');
    refreshFeed();
  };

  // Safety
  const blockUser = async (targetId: string) => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }
    db.blockUser(currentUser.id, targetId);
    showToast('User blocked. Neither of you will see each other.', 'info');
    if (selectedProfileId === targetId) {
      setSelectedProfileId(null);
      setActiveTab('home');
    }
    refreshFeed();
  };

  const unblockUser = async (targetId: string) => {
    if (!currentUser) return;
    db.unblockUser(currentUser.id, targetId);
    showToast('User unblocked.', 'info');
    refreshFeed();
  };

  const reportTarget = async (type: 'post' | 'profile', targetId: string, reason: string, details?: string) => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }
    db.reportTarget(currentUser.id, type, targetId, reason, details);
    showToast('Report submitted for review. Thank you for keeping Amapati safe.', 'success');
  };

  const getActivityLogs = (): ActivityLog[] => {
    if (!currentUser) return [];
    return db.getActivityLogs(currentUser.id);
  };

  const updateSupabaseConfig = (url: string, key: string) => {
    saveStoredSupabaseConfig(url, key);
    setSupabaseConfigState({ url, key });
    const live = isSupabaseConfigured();
    setIsSupabaseLive(live);
    if (live) {
      showToast('Connected to Supabase project!', 'success');
    } else {
      showToast('Switched to local database mode.');
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        activeTab,
        setActiveTab,
        selectedProfileId,
        viewProfile,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,

        isAuthModalOpen,
        openAuthModal: () => setAuthModalOpen(true),
        closeAuthModal: () => setAuthModalOpen(false),
        sendOtp,
        verifyOtp,
        logout,
        switchAccount,
        updateProfile,
        deleteAccount,

        posts,
        refreshFeed,
        createPost,
        updatePost,
        deletePost,

        followUser,
        unfollowUser,
        removeFollower,
        approveFollowRequest,

        blockUser,
        unblockUser,
        reportTarget,
        getActivityLogs,

        isCreateModalOpen,
        openCreateModal: () => {
          if (!currentUser) {
            setAuthModalOpen(true);
          } else {
            setCreateModalOpen(true);
          }
        },
        closeCreateModal: () => setCreateModalOpen(false),
        isEditProfileModalOpen,
        setEditProfileModalOpen,
        isSettingsModalOpen,
        setSettingsModalOpen,
        isAccountSwitcherModalOpen,
        setAccountSwitcherModalOpen,
        isActivityLogModalOpen,
        setActivityLogModalOpen,
        isSupabaseModalOpen,
        setSupabaseModalOpen,

        toasts,
        showToast,
        dismissToast,

        supabaseConfig,
        updateSupabaseConfig,
        isSupabaseLive,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
