import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../lib/mockEngine';
import { viewTracker } from '../lib/viewTracker';
import { getStoredSupabaseConfig, isSupabaseConfigured, saveStoredSupabaseConfig } from '../lib/supabase';
import {
  ActivityLog,
  AppNotification,
  Comment,
  Conversation,
  Message,
  Post,
  Profile,
  Report,
  VerificationRequest,
  BusinessInsightsData,
  Transaction,
  TransactionStatus,
  TransactionType,
  PaymentMethod,
  TransactionAuditLog,
  FinancialSummary,
  GeoLocationCoords,
  LocationCountry,
  LocationDistrict,
  BusinessReview,
  SearchAutoSuggestion,
  FeedbackSurvey,
  FeedbackSurveyOption,
} from '../types';
import { findNearestDistrict, LOCATION_COUNTRIES, KAMPALA_PRESETS } from '../lib/locationData';

interface ToastMessage {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

export type TabType = 'home' | 'discover' | 'profile' | 'messages' | 'admin' | 'auth' | 'insights' | 'events';

interface AppContextType {
  currentUser: Profile | null;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  selectedProfileId: string | null;
  viewProfile: (profileId: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;

  // Location & Geolocation Discovery
  selectedCountry: string;
  setSelectedCountry: (country: string) => void;
  selectedDistrict: string;
  setSelectedDistrict: (district: string) => void;
  userCoords: GeoLocationCoords | null;
  setUserCoords: (coords: GeoLocationCoords | null) => void;
  isGeoActive: boolean;
  geoError: string | null;
  locationRadiusKm: number;
  setLocationRadiusKm: (radius: number) => void;
  discoverSort: 'trending' | 'distance' | 'latest';
  setDiscoverSort: (sort: 'trending' | 'distance' | 'latest') => void;
  discoverMode: 'posts' | 'businesses';
  setDiscoverMode: (mode: 'posts' | 'businesses') => void;
  businesses: Profile[];
  requestUserLocation: () => Promise<boolean>;
  simulateLocationPreset: (presetId: string) => void;
  clearLocationFilter: () => void;

  // Reviews & Auto-Suggest
  getBusinessReviews: (businessId: string) => BusinessReview[];
  addBusinessReview: (data: {
    business_id: string;
    rating: number;
    title: string;
    comment: string;
    tags?: string[];
  }) => Promise<BusinessReview>;
  voteReviewHelpful: (reviewId: string) => Promise<{ helpful_votes: number; userVoted: boolean }>;
  deleteBusinessReview: (reviewId: string) => Promise<boolean>;
  getSearchAutoSuggestions: (query: string) => SearchAutoSuggestion[];
  isWriteReviewModalOpen: boolean;
  reviewTargetBusinessId: string | null;
  openWriteReviewModal: (businessId: string) => void;
  closeWriteReviewModal: () => void;

  // User Feedback Surveys
  getBusinessSurvey: (businessId: string) => FeedbackSurvey | null;
  saveBusinessSurvey: (data: {
    id?: string;
    business_id: string;
    question: string;
    category?: string;
    options: Array<{ id?: string; text: string; votes?: number }>;
  }) => FeedbackSurvey;
  voteBusinessSurvey: (surveyId: string, optionId: string) => Promise<FeedbackSurvey | null>;
  closeBusinessSurvey: (surveyId: string) => boolean;
  deleteBusinessSurvey: (surveyId: string) => boolean;

  // Auth & Onboarding
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  isOnboardingModalOpen: boolean;
  setOnboardingModalOpen: (open: boolean) => void;

  // Onboarding Tour
  isOnboardingTourOpen: boolean;
  tourStepIndex: number;
  startOnboardingTour: () => void;
  nextTourStep: () => void;
  prevTourStep: () => void;
  skipOnboardingTour: () => void;
  completeOnboardingTour: () => void;
  resetOnboardingTour: () => void;
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
  recordView: (postId: string) => void;
  recordViewsBatch: (postIds: string[]) => void;
  recomputeTrending: () => void;
  getProfilePosts: (userId: string, sort?: 'latest' | 'popular') => Post[];
  createPost: (data: {
    media_type: 'image' | 'video' | 'audio';
    media_url: string;
    caption: string;
    duration?: number;
    thumbnail_url?: string;
  }) => Promise<Post>;
  updatePost: (postId: string, updates: Partial<Post>) => Promise<Post>;
  deletePost: (postId: string) => Promise<boolean>;
  togglePostLike: (postId: string) => Promise<{ isLiked: boolean; likesCount: number }>;
  softDeleteContent: (
    contentType: 'post' | 'comment',
    contentId: string,
    reason?: 'user_deleted' | 'moderator_removed'
  ) => Promise<boolean>;
  restoreContent: (contentType: 'post' | 'comment', contentId: string) => Promise<boolean>;

  // Business Insights
  getBusinessInsights: (userId?: string, timeRange?: '7d' | '30d' | 'all') => BusinessInsightsData;

  // Comments V2
  getComments: (postId: string, sortBy?: 'top' | 'newest') => Comment[];
  addComment: (
    postId: string,
    body: string,
    parentCommentId?: string | null,
    mentionedUserIds?: string[]
  ) => Promise<Comment>;
  toggleCommentLike: (commentId: string) => Promise<{ isLiked: boolean; likesCount: number }>;
  togglePinComment: (postId: string, commentId: string) => Promise<boolean>;
  editComment: (commentId: string, newBody: string) => Promise<Comment>;
  deleteComment: (commentId: string, postId: string) => Promise<boolean>;

  // Notifications
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  // Direct Messaging
  conversations: Conversation[];
  activeChatUserId: string | null;
  setActiveChatUserId: (userId: string | null) => void;
  openChatWithUser: (userId: string) => void;
  getChatMessages: (otherUserId: string) => Message[];
  sendMessage: (recipientId: string, content: string) => Promise<Message>;
  canSendMessage: (recipientId: string) => { allowed: boolean; reason?: string };
  markConversationRead: (otherUserId: string) => void;
  simulateReply: (otherUserId: string) => void;
  unreadMessagesCount: number;

  // Follow
  followUser: (targetId: string) => Promise<void>;
  unfollowUser: (targetId: string) => Promise<void>;
  removeFollower: (followerId: string) => Promise<void>;
  approveFollowRequest: (followerId: string) => Promise<void>;

  // Safety & Moderation
  blockUser: (targetId: string) => Promise<void>;
  unblockUser: (targetId: string) => Promise<void>;
  reportTarget: (type: 'post' | 'profile' | 'comment', targetId: string, reason: string, details?: string) => Promise<void>;
  getActivityLogs: () => ActivityLog[];

  // Staff & Admin
  isStaff: boolean;
  staffRole: 'admin' | 'moderator' | null;
  getReports: () => Report[];
  updateReportStatus: (reportId: string, status: 'open' | 'in_review' | 'resolved' | 'dismissed') => void;
  getVerificationRequests: () => VerificationRequest[];
  approveVerification: (reqId: string) => void;
  rejectVerification: (reqId: string, reason: string) => void;
  toggleVerifiedBadge: (userId: string) => void;

  // Transactions & PostgreSQL Ledger
  transactions: Transaction[];
  getTransactions: (filters?: {
    status?: string;
    sellerId?: string;
    buyerId?: string;
    search?: string;
    type?: string;
  }) => Transaction[];
  recordTransaction: (data: {
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
  }) => Promise<Transaction>;
  updateTransactionStatus: (
    id: string,
    newStatus: TransactionStatus,
    reason: string
  ) => Promise<Transaction>;
  refundTransaction: (id: string, reason: string) => Promise<Transaction>;
  resolveDispute: (id: string, resolution: 'settled' | 'refunded', reason: string) => Promise<Transaction>;
  getFinancialSummary: () => FinancialSummary;
  getTransactionAuditLogs: (transactionId?: string) => TransactionAuditLog[];
  refreshTransactions: () => void;

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

  // Global Search
  isGlobalSearchOpen: boolean;
  globalSearchInitialTab?: 'all' | 'friends' | 'businesses' | 'products';
  globalSearchQuery: string;
  setGlobalSearchQuery: (query: string) => void;
  openGlobalSearch: (initialQuery?: string, initialTab?: 'all' | 'friends' | 'businesses' | 'products') => void;
  closeGlobalSearch: () => void;

  toasts: ToastMessage[];
  showToast: (message: string, type?: 'info' | 'success' | 'error') => void;
  dismissToast: (id: string) => void;

  supabaseConfig: { url: string; key: string };
  updateSupabaseConfig: (url: string, key: string) => void;
  isSupabaseLive: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const CURRENT_USER_STORAGE_KEY = 'amapati_current_user_id_v4';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [posts, setPosts] = useState<Post[]>([]);

  // Location & Geolocation Discovery
  const [selectedCountry, setSelectedCountry] = useState<string>('UG');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ug_all');
  const [userCoords, setUserCoords] = useState<GeoLocationCoords | null>(null);
  const [isGeoActive, setIsGeoActive] = useState<boolean>(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [locationRadiusKm, setLocationRadiusKm] = useState<number>(0);
  const [discoverSort, setDiscoverSort] = useState<'trending' | 'distance' | 'latest'>('trending');
  const [discoverMode, setDiscoverMode] = useState<'posts' | 'businesses'>('posts');
  const [businesses, setBusinesses] = useState<Profile[]>([]);

  // Messaging & Notifications
  const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Modals
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [isOnboardingModalOpen, setOnboardingModalOpen] = useState(false);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isEditProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
  const [isAccountSwitcherModalOpen, setAccountSwitcherModalOpen] = useState(false);
  const [isActivityLogModalOpen, setActivityLogModalOpen] = useState(false);
  const [isSupabaseModalOpen, setSupabaseModalOpen] = useState(false);
  const [isWriteReviewModalOpen, setWriteReviewModalOpen] = useState(false);
  const [reviewTargetBusinessId, setReviewTargetBusinessId] = useState<string | null>(null);

  // Onboarding Tour State & Auto-trigger
  const [isOnboardingTourOpen, setIsOnboardingTourOpen] = useState(false);
  const [tourStepIndex, setTourStepIndex] = useState(0);

  // Auto-trigger tour for new business users if not completed in database
  useEffect(() => {
    if (currentUser) {
      const record = db.getUserTourRecord(currentUser.id);
      if (!record.is_completed) {
        const timer = setTimeout(() => {
          setTourStepIndex(record.current_step || 0);
          setIsOnboardingTourOpen(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [currentUser?.id]);

  const startOnboardingTour = () => {
    setTourStepIndex(0);
    setIsOnboardingTourOpen(true);
  };

  const nextTourStep = () => {
    if (tourStepIndex < 4) {
      const next = tourStepIndex + 1;
      setTourStepIndex(next);
      if (currentUser) {
        db.saveUserTourProgress(currentUser.id, next, false);
      }
    } else {
      completeOnboardingTour();
    }
  };

  const prevTourStep = () => {
    if (tourStepIndex > 0) {
      const prev = tourStepIndex - 1;
      setTourStepIndex(prev);
      if (currentUser) {
        db.saveUserTourProgress(currentUser.id, prev, false);
      }
    }
  };

  const skipOnboardingTour = () => {
    setIsOnboardingTourOpen(false);
    if (currentUser) {
      db.saveUserTourProgress(currentUser.id, tourStepIndex, true);
    }
    showToast('Tour skipped. You can relaunch it anytime from Settings or Profile.', 'info');
  };

  const completeOnboardingTour = () => {
    setIsOnboardingTourOpen(false);
    if (currentUser) {
      db.saveUserTourProgress(currentUser.id, 4, true);
    }
    showToast('🎉 Tour complete! Welcome to Amapati. Your progress has been saved.', 'success');
  };

  const resetOnboardingTour = () => {
    if (currentUser) {
      db.resetUserTour(currentUser.id);
    }
    setTourStepIndex(0);
    setIsOnboardingTourOpen(true);
  };

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Global Search State & Shortcut
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [globalSearchInitialTab, setGlobalSearchInitialTab] = useState<'all' | 'friends' | 'businesses' | 'products'>('all');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  const openGlobalSearch = (
    initialQuery: string = '',
    initialTab: 'all' | 'friends' | 'businesses' | 'products' = 'all'
  ) => {
    setGlobalSearchQuery(initialQuery);
    setGlobalSearchInitialTab(initialTab);
    setIsGlobalSearchOpen(true);
  };

  const closeGlobalSearch = () => {
    setIsGlobalSearchOpen(false);
  };

  // Keyboard shortcut: Cmd+K / Ctrl+K opens global search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  // Initialize Session: Load stored user or default to Bella Terra Roasters
  useEffect(() => {
    const storedId = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
    if (storedId) {
      const profile = db.getProfile(storedId);
      if (profile) {
        setCurrentUser(profile);
      } else {
        const demo = db.getProfile('user_coffee');
        if (demo) setCurrentUser(demo);
      }
    } else {
      const demo = db.getProfile('user_coffee');
      if (demo) {
        setCurrentUser(demo);
        localStorage.setItem(CURRENT_USER_STORAGE_KEY, demo.id);
      }
    }
  }, []);

  // Sync /admin URL if path is /admin
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname === '/admin') {
      setActiveTab('admin');
    }
  }, []);

  // Wire up client-side viewTracker flush handler
  useEffect(() => {
    viewTracker.setFlushHandler((postIds) => {
      db.recordViewsBatch(postIds, currentUser?.id);
    });
  }, [currentUser?.id]);

  const recordView = (postId: string) => {
    viewTracker.queueView(postId, currentUser?.id);
  };

  const recordViewsBatch = (postIds: string[]) => {
    db.recordViewsBatch(postIds, currentUser?.id);
  };

  const recomputeTrending = () => {
    db.recomputeTrendingScores();
    refreshFeed();
  };

  const getProfilePosts = (userId: string, sort: 'latest' | 'popular' = 'latest') => {
    return db.getPostsByUser(userId, currentUser?.id, sort);
  };

  // Location & Geolocation handlers
  const handleSetSelectedCountry = (country: string) => {
    setSelectedCountry(country);
    if (country === 'all') {
      setSelectedDistrict('all');
    } else {
      const cObj = LOCATION_COUNTRIES.find((c) => c.code.toLowerCase() === country.toLowerCase());
      setSelectedDistrict(cObj?.districts[0]?.id || 'all');
    }
  };

  const requestUserLocation = async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      showToast('Geolocation is not supported by your browser.', 'error');
      return false;
    }

    setGeoError(null);
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: GeoLocationCoords = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          };
          setUserCoords(coords);
          setIsGeoActive(true);
          setDiscoverSort('distance');
          const nearest = findNearestDistrict(coords);
          if (nearest) {
            setSelectedCountry(nearest.country.code);
            setSelectedDistrict(nearest.district.id);
            showToast(`📍 Located near ${nearest.district.name}, ${nearest.country.name}!`, 'success');
          } else {
            showToast('📍 Geolocation active: showing closest showcases first.', 'success');
          }
          resolve(true);
        },
        (err) => {
          console.warn('Geolocation error:', err);
          let msg = 'Location access denied or unavailable.';
          if (err.code === 1) {
            msg = 'Location permission denied. You can select a region manually or test with Kampala presets.';
          } else if (err.code === 2) {
            msg = 'Location signal unavailable. You can select a region manually.';
          } else if (err.code === 3) {
            msg = 'Location request timed out.';
          }
          setGeoError(msg);
          showToast(msg, 'info');
          resolve(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  };

  const simulateLocationPreset = (presetId: string) => {
    const preset = KAMPALA_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setUserCoords({
      latitude: preset.latitude,
      longitude: preset.longitude,
      accuracy: 15,
    });
    setIsGeoActive(true);
    setGeoError(null);
    setSelectedCountry('UG');
    setSelectedDistrict(preset.districtId);
    setDiscoverSort('distance');
    showToast(`📍 Simulated GPS in ${preset.name}! Closest venues prioritized.`, 'success');
  };

  const clearLocationFilter = () => {
    setSelectedCountry('all');
    setSelectedDistrict('all');
    setUserCoords(null);
    setIsGeoActive(false);
    setGeoError(null);
    setLocationRadiusKm(0);
    setDiscoverSort('trending');
    showToast('Location filter cleared. Showing global showcases.', 'info');
  };

  // Reviews & Auto-Suggestions handlers
  const openWriteReviewModal = (businessId: string) => {
    if (!currentUser) {
      setActiveTab('auth');
      showToast('Please sign in to write a review.', 'info');
      return;
    }
    setReviewTargetBusinessId(businessId);
    setWriteReviewModalOpen(true);
  };

  const closeWriteReviewModal = () => {
    setWriteReviewModalOpen(false);
    setReviewTargetBusinessId(null);
  };

  const getBusinessReviews = (businessId: string): BusinessReview[] => {
    return db.getBusinessReviews(businessId);
  };

  const addBusinessReview = async (data: {
    business_id: string;
    rating: number;
    title: string;
    comment: string;
    tags?: string[];
  }): Promise<BusinessReview> => {
    if (!currentUser) throw new Error('Must be logged in to review');
    const newRev = db.addBusinessReview({
      ...data,
      user_id: currentUser.id,
      author_name: currentUser.business_name || 'Artisan Reviewer',
      author_avatar: currentUser.avatar_url,
      is_verified_patron: true,
      visit_date: 'Recently',
    });
    refreshFeed();
    showToast(`Your ★ ${data.rating} review was published!`, 'success');
    return newRev;
  };

  const voteReviewHelpful = async (reviewId: string): Promise<{ helpful_votes: number; userVoted: boolean }> => {
    if (!currentUser) {
      showToast('Please sign in to vote.', 'info');
      return { helpful_votes: 0, userVoted: false };
    }
    const result = db.voteReviewHelpful(reviewId, currentUser.id);
    showToast(result.userVoted ? 'Marked as helpful' : 'Vote removed', 'info');
    return result;
  };

  const deleteBusinessReview = async (reviewId: string): Promise<boolean> => {
    if (!currentUser) return false;
    const ok = db.deleteBusinessReview(reviewId, currentUser.id);
    if (ok) {
      refreshFeed();
      showToast('Review deleted.', 'info');
    }
    return ok;
  };

  const getSearchAutoSuggestions = (query: string): SearchAutoSuggestion[] => {
    return db.getSearchAutoSuggestions(query, currentUser?.id);
  };

  // User Feedback Surveys
  const getBusinessSurvey = (businessId: string): FeedbackSurvey | null => {
    return db.getBusinessSurvey(businessId);
  };

  const saveBusinessSurvey = (data: {
    id?: string;
    business_id: string;
    question: string;
    category?: string;
    options: Array<{ id?: string; text: string; votes?: number }>;
  }): FeedbackSurvey => {
    const survey = db.saveBusinessSurvey(data);
    showToast('Feedback survey published to your profile!', 'success');
    return survey;
  };

  const voteBusinessSurvey = async (surveyId: string, optionId: string): Promise<FeedbackSurvey | null> => {
    const voterId = currentUser ? currentUser.id : `guest_${Math.random().toString(36).substring(7)}`;
    const updated = db.voteBusinessSurvey(surveyId, optionId, voterId);
    if (updated) {
      showToast('Thank you for voting! Your voice shapes our craft.', 'success');
    }
    return updated;
  };

  const closeBusinessSurvey = (surveyId: string): boolean => {
    const ok = db.closeBusinessSurvey(surveyId);
    if (ok) showToast('Survey closed.', 'info');
    return ok;
  };

  const deleteBusinessSurvey = (surveyId: string): boolean => {
    const ok = db.deleteBusinessSurvey(surveyId);
    if (ok) showToast('Survey deleted.', 'info');
    return ok;
  };

  // Refresh feed, conversations & notifications
  const refreshFeed = () => {
    const feed = db.getPosts({
      viewerId: currentUser?.id,
      feedType: activeTab === 'home' ? 'following' : 'discover',
      category: activeTab === 'discover' ? selectedCategory : undefined,
      searchQuery: activeTab === 'discover' ? searchQuery : undefined,
      country: activeTab === 'discover' ? selectedCountry : undefined,
      district: activeTab === 'discover' ? selectedDistrict : undefined,
      userCoords: userCoords,
      maxDistanceKm: isGeoActive && locationRadiusKm > 0 ? locationRadiusKm : undefined,
      sort: activeTab === 'discover' ? (discoverSort === 'distance' ? 'distance' : discoverSort) : undefined,
    });
    setPosts(feed);

    if (activeTab === 'discover') {
      const bList = db.getBusinesses({
        currentUserId: currentUser?.id,
        country: selectedCountry,
        district: selectedDistrict,
        category: selectedCategory,
        searchQuery: searchQuery,
        userCoords: userCoords,
        maxDistanceKm: isGeoActive && locationRadiusKm > 0 ? locationRadiusKm : undefined,
        sort: discoverSort === 'distance' ? 'distance' : 'trending',
      });
      setBusinesses(bList);
    }

    if (currentUser) {
      const refreshed = db.getProfile(currentUser.id);
      if (refreshed) setCurrentUser(refreshed);
      setConversations(db.getConversations(currentUser.id));
      setNotifications(db.getNotifications(currentUser.id));
    } else {
      setConversations([]);
      setNotifications([]);
    }
  };

  useEffect(() => {
    refreshFeed();
  }, [
    activeTab,
    selectedCategory,
    searchQuery,
    selectedCountry,
    selectedDistrict,
    userCoords,
    locationRadiusKm,
    discoverSort,
    currentUser?.id,
  ]);

  const viewProfile = (profileId: string) => {
    setSelectedProfileId(profileId);
    setActiveTab('profile');
  };

  const openChatWithUser = (userId: string) => {
    if (!currentUser) {
      setActiveTab('auth');
      showToast('Please sign in to message businesses.', 'info');
      return;
    }
    setActiveChatUserId(userId);
    setActiveTab('messages');
  };

  // Auth functions
  const sendOtp = async (_type: 'email' | 'phone', _value: string): Promise<{ code: string }> => {
    const code = '123456';
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ code });
      }, 350);
    });
  };

  const verifyOtp = async (
    type: 'email' | 'phone',
    value: string,
    code: string,
    businessInfo?: { businessName: string; category: string; bio?: string; contact?: string; avatar_url?: string }
  ): Promise<boolean> => {
    if (code !== '123456' && code.length !== 6) {
      showToast('Invalid verification code. Use 123456 for instant access.', 'error');
      return false;
    }

    const userId = 'usr_' + value.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    let profile = db.getProfile(userId);
    const isNewUser = !profile;

    if (isNewUser) {
      profile = db.createOrUpdateProfile({
        id: userId,
        business_name: businessInfo?.businessName || (type === 'email' ? value.split('@')[0] : 'My Business'),
        category: businessInfo?.category || 'Craft & Artisan',
        bio: businessInfo?.bio || 'Handcrafted goods with passion.',
        contact: businessInfo?.contact || value,
        avatar_url: businessInfo?.avatar_url || '/src/assets/images/coffee_roaster_1790587302699.jpg',
        is_private: false,
      });
      showToast('Welcome to Amapati! Let\'s setup your showcase.', 'success');
    } else if (profile) {
      showToast('Welcome back, ' + profile.business_name + '!', 'success');
    }

    if (profile) {
      setCurrentUser(profile);
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, profile.id);
    }
    setAuthModalOpen(false);
    setActiveTab('home');
    refreshFeed();

    // Launch onboarding wizard for new users!
    if (isNewUser) {
      setTimeout(() => {
        setOnboardingModalOpen(true);
      }, 400);
    }

    return true;
  };

  const logout = () => {
    localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    setCurrentUser(null);
    setSelectedProfileId(null);
    setActiveChatUserId(null);
    setActiveTab('auth');
    showToast('Logged out. Please sign in or create a business account.');
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
    if (activeTab === 'auth') setActiveTab('home');
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
      setActiveTab('auth');
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

  const togglePostLike = async (postId: string): Promise<{ isLiked: boolean; likesCount: number }> => {
    if (!currentUser) {
      setAuthModalOpen(true);
      throw new Error('Please sign in to like showcases');
    }
    const result = db.togglePostLike(postId, currentUser.id);
    refreshFeed();
    return result;
  };

  const softDeleteContent = async (
    contentType: 'post' | 'comment',
    contentId: string,
    reason: 'user_deleted' | 'moderator_removed' = 'user_deleted'
  ): Promise<boolean> => {
    if (!currentUser) throw new Error('Not authenticated');
    const result = db.softDeleteContent(contentType, contentId, reason, currentUser.id);
    if (result.success) {
      showToast(
        `${contentType === 'post' ? 'Showcase' : 'Comment'} removed from feed. Recoverable in Activity Log for ${result.retention_days} days.`,
        'info'
      );
      refreshFeed();
    }
    return result.success;
  };

  const restoreContent = async (contentType: 'post' | 'comment', contentId: string): Promise<boolean> => {
    if (!currentUser) throw new Error('Not authenticated');
    const result = db.restoreContent(contentType, contentId, currentUser.id);
    if (result.success) {
      showToast(result.message || 'Content successfully recovered!', 'success');
      refreshFeed();
    }
    return result.success;
  };

  const getBusinessInsights = (
    userId?: string,
    timeRange: '7d' | '30d' | 'all' = '7d'
  ): BusinessInsightsData => {
    const targetId = userId || currentUser?.id || 'user_coffee';
    return db.getBusinessInsights(targetId, timeRange);
  };

  const deletePost = async (postId: string): Promise<boolean> => {
    return softDeleteContent('post', postId, 'user_deleted');
  };

  // Comments V2
  const getComments = (postId: string, sortBy: 'top' | 'newest' = 'top'): Comment[] => {
    return db.getComments(postId, currentUser?.id, sortBy);
  };

  const addComment = async (
    postId: string,
    body: string,
    parentCommentId?: string | null,
    mentionedUserIds?: string[]
  ): Promise<Comment> => {
    if (!currentUser) {
      setActiveTab('auth');
      throw new Error('Please sign in to comment on showcases.');
    }
    const comment = db.addComment(postId, currentUser.id, body, parentCommentId, mentionedUserIds);
    showToast(parentCommentId ? 'Reply posted.' : 'Comment posted.', 'success');
    refreshFeed();
    return comment;
  };

  const toggleCommentLike = async (commentId: string): Promise<{ isLiked: boolean; likesCount: number }> => {
    if (!currentUser) {
      setActiveTab('auth');
      throw new Error('Please sign in to like comments.');
    }
    const res = db.toggleCommentLike(commentId, currentUser.id);
    refreshFeed();
    return res;
  };

  const togglePinComment = async (postId: string, commentId: string): Promise<boolean> => {
    if (!currentUser) throw new Error('Not authenticated');
    const isPinned = db.togglePinComment(postId, commentId, currentUser.id);
    showToast(isPinned ? 'Comment pinned to top of showcase.' : 'Comment unpinned.', 'success');
    refreshFeed();
    return isPinned;
  };

  const editComment = async (commentId: string, newBody: string): Promise<Comment> => {
    if (!currentUser) throw new Error('Not authenticated');
    const updated = db.editComment(commentId, currentUser.id, newBody);
    showToast('Comment updated.', 'success');
    refreshFeed();
    return updated;
  };

  const deleteComment = async (commentId: string, _postId: string): Promise<boolean> => {
    return softDeleteContent('comment', commentId, 'user_deleted');
  };

  // Notifications
  const markNotificationRead = (id: string) => {
    db.markNotificationRead(id);
    if (currentUser) setNotifications(db.getNotifications(currentUser.id));
  };

  const markAllNotificationsRead = () => {
    if (!currentUser) return;
    db.markAllNotificationsRead(currentUser.id);
    setNotifications(db.getNotifications(currentUser.id));
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.is_read).length;

  // Messaging & Reply Protection
  const getChatMessages = (otherUserId: string): Message[] => {
    if (!currentUser) return [];
    return db.getMessages(currentUser.id, otherUserId);
  };

  const canSendMessage = (recipientId: string): { allowed: boolean; reason?: string } => {
    if (!currentUser) return { allowed: false, reason: 'Please sign in to send messages.' };
    return db.canSendMessage(currentUser.id, recipientId);
  };

  const sendMessage = async (recipientId: string, content: string): Promise<Message> => {
    if (!currentUser) {
      setActiveTab('auth');
      throw new Error('Please sign in to send messages.');
    }
    const msg = db.sendMessage(currentUser.id, recipientId, content);
    setConversations(db.getConversations(currentUser.id));
    return msg;
  };

  const markConversationRead = (otherUserId: string) => {
    if (!currentUser) return;
    db.markConversationRead(currentUser.id, otherUserId);
    setConversations(db.getConversations(currentUser.id));
  };

  const simulateReply = (otherUserId: string) => {
    if (!currentUser) return;
    db.simulateReply(otherUserId, currentUser.id);
    setConversations(db.getConversations(currentUser.id));
    const sender = db.getProfile(otherUserId);
    showToast(`New reply from ${sender?.business_name || 'artisan'}! Inbox unlocked.`, 'info');
  };

  const unreadMessagesCount = conversations.reduce((acc, c) => acc + c.unread_count, 0);

  // Follows
  const followUser = async (targetId: string) => {
    if (!currentUser) {
      setActiveTab('auth');
      showToast('Please sign in to follow businesses.', 'info');
      return;
    }
    const status = db.followUser(currentUser.id, targetId);
    if (status) {
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
      setActiveTab('auth');
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

  const reportTarget = async (type: 'post' | 'profile' | 'comment', targetId: string, reason: string, details?: string) => {
    if (!currentUser) {
      setActiveTab('auth');
      return;
    }
    db.reportTarget(currentUser.id, type, targetId, reason, details);
    showToast('Report submitted for moderation review. Thank you.', 'success');
  };

  const getActivityLogs = (): ActivityLog[] => {
    return db.getActivityLogs(currentUser?.id);
  };

  // Staff & Admin
  const isStaff = currentUser ? db.isStaff(currentUser.id) || currentUser.id === 'user_admin' : false;
  const staffRole = currentUser ? db.getStaffRole(currentUser.id) || (currentUser.id === 'user_admin' ? 'admin' : null) : null;

  const getReports = (): Report[] => db.getReports();

  const updateReportStatus = (reportId: string, status: 'open' | 'in_review' | 'resolved' | 'dismissed') => {
    db.updateReportStatus(reportId, status);
    showToast(`Report updated to ${status}.`, 'info');
  };

  const getVerificationRequests = (): VerificationRequest[] => db.getVerificationRequests();

  const approveVerification = (reqId: string) => {
    if (!currentUser) return;
    db.approveVerification(reqId, currentUser.id);
    showToast('Business verified! Verified badge granted.', 'success');
    refreshFeed();
  };

  const rejectVerification = (reqId: string, reason: string) => {
    if (!currentUser) return;
    db.rejectVerification(reqId, currentUser.id, reason);
    showToast('Verification request rejected.', 'info');
    refreshFeed();
  };

  const toggleVerifiedBadge = (userId: string) => {
    if (!currentUser) return;
    db.toggleVerifiedBadge(userId, currentUser.id);
    showToast('Verified badge status updated.', 'success');
    refreshFeed();
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

  // Transactions & PostgreSQL Ledger state and methods
  const [transactions, setTransactions] = useState<Transaction[]>(() => db.getTransactions());

  const refreshTransactions = () => {
    setTransactions(db.getTransactions());
  };

  const getTransactions = (filters?: {
    status?: string;
    sellerId?: string;
    buyerId?: string;
    search?: string;
    type?: string;
  }): Transaction[] => {
    return db.getTransactions(filters);
  };

  const recordTransaction = async (data: {
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
  }): Promise<Transaction> => {
    const adminId = currentUser?.id || 'user_admin';
    const tx = db.recordTransaction(data, adminId);
    refreshTransactions();
    showToast(`Transaction ${tx.reference_id} recorded in ledger ($${(tx.amount_cents / 100).toFixed(2)})!`, 'success');
    return tx;
  };

  const updateTransactionStatus = async (
    id: string,
    newStatus: TransactionStatus,
    reason: string
  ): Promise<Transaction> => {
    const adminId = currentUser?.id || 'user_admin';
    const tx = db.updateTransactionStatus(id, newStatus, adminId, reason);
    refreshTransactions();
    showToast(`Transaction ${tx.reference_id} marked as ${newStatus}.`, 'info');
    return tx;
  };

  const refundTransaction = async (id: string, reason: string): Promise<Transaction> => {
    const adminId = currentUser?.id || 'user_admin';
    const tx = db.updateTransactionStatus(id, 'refunded', adminId, reason);
    refreshTransactions();
    showToast(`Refund issued for ${tx.reference_id}.`, 'info');
    return tx;
  };

  const resolveDispute = async (
    id: string,
    resolution: 'settled' | 'refunded',
    reason: string
  ): Promise<Transaction> => {
    const adminId = currentUser?.id || 'user_admin';
    const tx = db.updateTransactionStatus(id, resolution, adminId, `Dispute resolved: ${reason}`);
    refreshTransactions();
    showToast(`Dispute on ${tx.reference_id} resolved as ${resolution}.`, 'success');
    return tx;
  };

  const getFinancialSummary = (): FinancialSummary => {
    return db.getFinancialSummary();
  };

  const getTransactionAuditLogs = (transactionId?: string): TransactionAuditLog[] => {
    return db.getTransactionAuditLogs(transactionId);
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

        // Location & Geolocation Discovery
        selectedCountry,
        setSelectedCountry: handleSetSelectedCountry,
        selectedDistrict,
        setSelectedDistrict,
        userCoords,
        setUserCoords,
        isGeoActive,
        geoError,
        locationRadiusKm,
        setLocationRadiusKm,
        discoverSort,
        setDiscoverSort,
        discoverMode,
        setDiscoverMode,
        businesses,
        requestUserLocation,
        simulateLocationPreset,
        clearLocationFilter,

        isAuthModalOpen,
        openAuthModal: () => setAuthModalOpen(true),
        closeAuthModal: () => setAuthModalOpen(false),
        isOnboardingModalOpen,
        setOnboardingModalOpen,
        sendOtp,
        verifyOtp,
        logout,
        switchAccount,
        updateProfile,
        deleteAccount,

        // Transactions & PostgreSQL Ledger
        transactions,
        getTransactions,
        recordTransaction,
        updateTransactionStatus,
        refundTransaction,
        resolveDispute,
        getFinancialSummary,
        getTransactionAuditLogs,
        refreshTransactions,

        posts,
        refreshFeed,
        recordView,
        recordViewsBatch,
        recomputeTrending,
        getProfilePosts,
        createPost,
        updatePost,
        deletePost,
        togglePostLike,
        softDeleteContent,
        restoreContent,
        getBusinessInsights,

        getComments,
        addComment,
        toggleCommentLike,
        togglePinComment,
        editComment,
        deleteComment,

        notifications,
        unreadNotificationsCount,
        markNotificationRead,
        markAllNotificationsRead,

        conversations,
        activeChatUserId,
        setActiveChatUserId,
        openChatWithUser,
        getChatMessages,
        sendMessage,
        canSendMessage,
        markConversationRead,
        simulateReply,
        unreadMessagesCount,

        followUser,
        unfollowUser,
        removeFollower,
        approveFollowRequest,

        blockUser,
        unblockUser,
        reportTarget,
        getActivityLogs,

        isStaff,
        staffRole,
        getReports,
        updateReportStatus,
        getVerificationRequests,
        approveVerification,
        rejectVerification,
        toggleVerifiedBadge,

        isCreateModalOpen,
        openCreateModal: () => {
          if (!currentUser) {
            setActiveTab('auth');
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

        // Reviews & Auto-Suggest
        getBusinessReviews,
        addBusinessReview,
        voteReviewHelpful,
        deleteBusinessReview,
        getSearchAutoSuggestions,
        isWriteReviewModalOpen,
        reviewTargetBusinessId,
        openWriteReviewModal,
        closeWriteReviewModal,

        // User Feedback Surveys
        getBusinessSurvey,
        saveBusinessSurvey,
        voteBusinessSurvey,
        closeBusinessSurvey,
        deleteBusinessSurvey,

        // Onboarding Tour
        isOnboardingTourOpen,
        tourStepIndex,
        startOnboardingTour,
        nextTourStep,
        prevTourStep,
        skipOnboardingTour,
        completeOnboardingTour,
        resetOnboardingTour,

        // Global Search
        isGlobalSearchOpen,
        globalSearchInitialTab,
        globalSearchQuery,
        setGlobalSearchQuery,
        openGlobalSearch,
        closeGlobalSearch,

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
