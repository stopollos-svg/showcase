import React, { useState, useMemo } from 'react';
import {
  Phone,
  ExternalLink,
  Edit3,
  Settings,
  Grid,
  Video,
  Image as ImageIcon,
  Mic,
  Lock,
  UserPlus,
  Check,
  UserMinus,
  Building2,
  Sparkles,
  ArrowLeft,
  Share2,
  Camera,
  LogOut,
  LogIn,
  Plus,
  MessageCircle,
  ShieldCheck,
  Flame,
  Zap,
  Heart,
  Eye,
  BarChart2,
  QrCode,
  X,
  Star,
  Package,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db } from '../../lib/mockEngine';
import { FollowersModal } from './FollowersModal';
import { BusinessQRCodeModal } from '../modals/BusinessQRCodeModal';
import { BusinessReviewsList } from './BusinessReviewsList';
import { BusinessProductCatalog } from './BusinessProductCatalog';
import { UserFeedbackSurveyWidget } from './UserFeedbackSurveyWidget';
import { ProfileEngagementSummary } from './ProfileEngagementSummary';
import { Post, MediaType } from '../../types';
import { PostCard } from '../feed/PostCard';
import { PerformanceScoreBadge } from '../common/PerformanceScoreBadge';
import { calculatePostPerformance } from '../../lib/performanceScore';

interface ProfileViewProps {
  onEditPost: (post: Post) => void;
  onReportPost: (post: Post) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onEditPost, onReportPost }) => {
  const {
    currentUser,
    selectedProfileId,
    setActiveTab,
    setEditProfileModalOpen,
    setSettingsModalOpen,
    setAccountSwitcherModalOpen,
    switchAccount,
    followUser,
    unfollowUser,
    openChatWithUser,
    openAuthModal,
    logout,
    showToast,
    openWriteReviewModal,
    startOnboardingTour,
  } = useApp();

  const [activeProfileTab, setActiveProfileTab] = useState<'showcases' | 'catalog' | 'reviews'>('showcases');
  const [mediaFilter, setMediaFilter] = useState<'all' | MediaType>('all');
  const [viewStyle, setViewStyle] = useState<'grid' | 'feed'>('grid');
  const [profileSort, setProfileSort] = useState<'latest' | 'popular' | 'performance'>('latest');
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followersModalTab, setFollowersModalTab] = useState<'followers' | 'following' | 'requests'>('followers');
  const [isQrModalOpen, setQrModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // If logged out and not viewing another profile, show business portal
  if (!currentUser && !selectedProfileId) {
    const allProfiles = db.getAllProfiles();
    return (
      <div className="max-w-xl mx-auto px-4 py-8 pb-24 text-center">
        <div className="w-16 h-16 rounded-3xl bg-orange-100 text-orange-600 mx-auto flex items-center justify-center mb-4 shadow-inner">
          <Building2 className="w-8 h-8" />
        </div>
        <h2 className="font-display text-xl font-bold text-stone-900 mb-1">
          Business Session Logged Out
        </h2>
        <p className="text-xs text-stone-500 max-w-sm mx-auto mb-6">
          You are currently in guest mode. Sign in to your business, create a new business account, or switch into any registered artisan profile.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-8">
          <button
            onClick={() => setActiveTab('auth')}
            className="w-full sm:w-auto px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-xl shadow-sm transition active:scale-95 flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In or Create Account</span>
          </button>
          <button
            onClick={() => setAccountSwitcherModalOpen(true)}
            className="w-full sm:w-auto px-5 py-2.5 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold rounded-xl transition active:scale-95 flex items-center justify-center gap-2"
          >
            <Building2 className="w-4 h-4 text-orange-600" />
            <span>View All Business Accounts</span>
          </button>
        </div>

        {/* Quick business switcher list */}
        <div className="text-left bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3 border-b border-stone-100 pb-2">
            <span className="font-bold text-xs text-stone-900">Registered Businesses:</span>
            <span className="text-[11px] text-stone-400">{allProfiles.length} available</span>
          </div>
          <div className="space-y-2">
            {allProfiles.map((p) => (
              <div
                key={p.id}
                className="p-2.5 rounded-xl border border-stone-200 hover:border-orange-300 hover:bg-stone-50/70 transition flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={p.avatar_url || '/src/assets/images/coffee_roaster_1790587302699.jpg'}
                    alt={p.business_name}
                    className="w-9 h-9 rounded-full object-cover border border-stone-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-stone-900 truncate">{p.business_name}</p>
                    <p className="text-[11px] text-stone-500 truncate">{p.category}</p>
                  </div>
                </div>
                <button
                  onClick={() => switchAccount(p.id)}
                  className="px-3 py-1 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg transition active:scale-95 shrink-0"
                >
                  Log In
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const targetProfileId = selectedProfileId || currentUser?.id || 'user_coffee';
  const profile = db.getProfile(targetProfileId, currentUser?.id);
  const isOwner = currentUser?.id === targetProfileId;

  if (!profile) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center text-stone-500">
        <p className="text-sm font-semibold">Business profile not found or blocked.</p>
        <button
          onClick={() => setActiveTab('home')}
          className="mt-4 px-4 py-2 bg-stone-900 text-white text-xs font-semibold rounded-xl"
        >
          Return to Feed
        </button>
      </div>
    );
  }

  // Get posts for this specific business
  const rawPosts = db
    .getPosts({
      viewerId: currentUser?.id,
      userId: targetProfileId,
      sort: profileSort === 'performance' ? 'popular' : profileSort,
    })
    .filter((p) => mediaFilter === 'all' || p.media_type === mediaFilter);

  const posts = useMemo(() => {
    if (profileSort === 'performance') {
      return [...rawPosts].sort((a, b) => {
        const scoreA = calculatePostPerformance(a).score;
        const scoreB = calculatePostPerformance(b).score;
        return scoreB - scoreA;
      });
    }
    return rawPosts;
  }, [rawPosts, profileSort]);

  const catalogProductsCount = db.getProducts(targetProfileId).length;

  const canViewContent = !profile.is_private || isOwner || profile.is_following;

  const handleFollowAction = () => {
    if (profile.is_following) {
      unfollowUser(profile.id);
    } else {
      followUser(profile.id);
    }
  };

  const openFollowers = (tab: 'followers' | 'following' | 'requests') => {
    setFollowersModalTab(tab);
    setFollowersModalOpen(true);
  };

  const handleShareProfile = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('Profile link copied to clipboard!');
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-4 pb-24">
      {/* Back button if viewing another business */}
      {selectedProfileId && (
        <div className="mb-3">
          <button
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Feed</span>
          </button>
        </div>
      )}

      {/* 1. Profile Header Card */}
      <section className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-sm mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="relative group">
            <img
              src={profile.avatar_url || '/src/assets/images/coffee_roaster_1790587302699.jpg'}
              alt={profile.business_name}
              referrerPolicy="no-referrer"
              className="w-20 h-20 rounded-2xl object-cover border-2 border-stone-100 shadow-sm"
            />
            {isOwner && (
              <button
                type="button"
                onClick={() => setEditProfileModalOpen(true)}
                className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-stone-900 hover:bg-orange-600 text-white shadow-md border-2 border-white transition active:scale-90"
                title="Change Profile Picture"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            )}
            {profile.is_private && !isOwner && (
              <span
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-stone-900 text-white text-xs flex items-center justify-center border-2 border-white"
                title="Private business account"
              >
                <Lock className="w-3 h-3 text-orange-400" />
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isOwner ? (
              <div className="flex flex-wrap items-center gap-1.5 justify-end">
                <button
                  onClick={startOnboardingTour}
                  className="px-3 py-1.5 rounded-xl border border-orange-200/90 bg-orange-50/70 hover:bg-orange-100/80 text-orange-900 text-xs font-semibold transition flex items-center gap-1.5 active:scale-95 shadow-2xs"
                  title="Interactive business features tour"
                >
                  <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                  <span>Tour</span>
                </button>
                <button
                  onClick={() => setActiveTab('insights')}
                  className="px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition flex items-center gap-1.5 active:scale-95 shadow-sm"
                  title="View post engagement metrics, views, and reach"
                >
                  <BarChart2 className="w-3.5 h-3.5 text-orange-400" />
                  <span>Insights</span>
                </button>
                <button
                  onClick={() => setQrModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-xs font-semibold text-stone-700 transition flex items-center gap-1.5 active:scale-95 shadow-2xs"
                  title="Generate printable market stand QR code"
                >
                  <QrCode className="w-3.5 h-3.5 text-orange-600" />
                  <span>Market QR</span>
                </button>
                <button
                  onClick={() => setEditProfileModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold transition flex items-center gap-1.5 active:scale-95 shadow-sm"
                  title="Edit business name, bio, and picture"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit My Account</span>
                </button>
                <button
                  onClick={() => setAccountSwitcherModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-xs font-semibold text-stone-700 transition flex items-center gap-1.5 active:scale-95"
                  title="Switch or view all business accounts"
                >
                  <Building2 className="w-3.5 h-3.5 text-orange-600" />
                  <span>Accounts</span>
                </button>
                <button
                  onClick={logout}
                  className="px-3 py-1.5 rounded-xl border border-red-200 bg-red-50/60 hover:bg-red-100 text-red-600 text-xs font-semibold transition flex items-center gap-1 active:scale-95"
                  title="Log out of business session"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
                <button
                  onClick={() => setSettingsModalOpen(true)}
                  className="min-h-[34px] min-w-[34px] rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 flex items-center justify-center transition"
                  title="Settings & Append-Only History"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => switchAccount(profile.id)}
                  className="px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold transition active:scale-95 flex items-center gap-1"
                  title="Switch your active session to manage this business"
                >
                  <Building2 className="w-3.5 h-3.5 text-orange-600" />
                  <span>Log in as this Business</span>
                </button>
                <button
                  onClick={handleFollowAction}
                  className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95 flex items-center gap-1.5 ${
                    profile.is_following
                      ? 'bg-stone-100 text-stone-800 hover:bg-stone-200'
                      : 'bg-orange-600 hover:bg-orange-700 text-white shadow-sm'
                  }`}
                >
                  {profile.is_following ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Follow</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => openChatWithUser(profile.id)}
                  className="px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold transition active:scale-95 flex items-center gap-1.5"
                  title="Direct Message this business"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-orange-600" />
                  <span>Message</span>
                </button>
                <button
                  onClick={() => setQrModalOpen(true)}
                  className="min-h-[36px] min-w-[36px] rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 flex items-center justify-center transition"
                  title="Generate or view Market QR Stand"
                >
                  <QrCode className="w-4 h-4 text-orange-600" />
                </button>
                <button
                  onClick={handleShareProfile}
                  className="min-h-[36px] min-w-[36px] rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 flex items-center justify-center transition"
                  title="Share Profile"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Business Title & Craft Category */}
        <div className="mb-3">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-lg font-black tracking-tight text-stone-900 flex items-center gap-1.5">
              <span>{profile.business_name}</span>
              {profile.is_verified && (
                <span title="Verified Artisan Business">
                  <ShieldCheck className="w-4 h-4 text-blue-600 inline fill-blue-100" />
                </span>
              )}
            </h1>
          </div>
          {/* Unboxed Metadata with Typographic Separator */}
          <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium mt-0.5">
            <span className="text-orange-700 font-semibold">{profile.category}</span>
            <span aria-hidden="true">·</span>
            <span>Artisan Studio</span>
          </div>

          {/* Star Rating & Reviews Badge */}
          <div className="flex items-center gap-2 text-xs mt-2 flex-wrap">
            <button
              onClick={() => setActiveProfileTab('reviews')}
              className="inline-flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 px-2.5 py-1 rounded-xl transition active:scale-95 shadow-2xs"
            >
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              <span className="font-mono font-bold text-xs">{profile.rating?.toFixed(1) || '5.0'}</span>
              <span className="text-[11px] text-amber-800">
                ({profile.review_count || 0} {profile.review_count === 1 ? 'review' : 'reviews'})
              </span>
            </button>

            {!isOwner && (
              <button
                onClick={() => openWriteReviewModal(profile.id)}
                className="text-xs font-semibold text-orange-600 hover:text-orange-700 underline"
              >
                + Write a Review
              </button>
            )}
          </div>
        </div>

        {/* Bio prose */}
        {profile.bio && (
          <p className="text-xs sm:text-sm text-stone-700 leading-relaxed mb-4">
            {profile.bio}
          </p>
        )}

        {/* Direct Contact Button */}
        {profile.contact && (
          <div className="mb-4">
            <a
              href={
                profile.contact.startsWith('http')
                  ? profile.contact
                  : profile.contact.includes('@')
                  ? `mailto:${profile.contact}`
                  : `tel:${profile.contact}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-xs font-semibold text-stone-800 transition"
            >
              <Phone className="w-3.5 h-3.5 text-orange-600" />
              <span>Contact: {profile.contact}</span>
            </a>
          </div>
        )}

        {/* Stats Row (Posts, Followers, Following) with Clickable Network List */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-stone-100 text-center">
          <div className="py-1">
            <span className="block font-mono text-base font-bold text-stone-900 tabular-nums">
              {profile.posts_count || 0}
            </span>
            <span className="text-[11px] text-stone-500">Showcases</span>
          </div>

          <button
            onClick={() => openFollowers('followers')}
            className="py-1 rounded-lg hover:bg-stone-50 transition group"
          >
            <span className="block font-mono text-base font-bold text-stone-900 tabular-nums group-hover:text-orange-600">
              {profile.followers_count || 0}
            </span>
            <span className="text-[11px] text-stone-500">Followers</span>
          </button>

          <button
            onClick={() => openFollowers('following')}
            className="py-1 rounded-lg hover:bg-stone-50 transition group"
          >
            <span className="block font-mono text-base font-bold text-stone-900 tabular-nums group-hover:text-orange-600">
              {profile.following_count || 0}
            </span>
            <span className="text-[11px] text-stone-500">Following</span>
          </button>
        </div>

        {/* Owner Quick Business Identity & Switcher Bar */}
        {isOwner && (
          <div className="mt-4 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2 bg-stone-50/80 p-3 rounded-xl border border-stone-200/80">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-stone-900">Active Business: {profile.business_name}</p>
                <p className="text-[10px] text-stone-500">Edit profile to other business names or change picture</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setActiveTab('insights')}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-orange-600 hover:bg-orange-700 text-white transition active:scale-95 flex items-center gap-1 shadow-2xs"
              >
                <BarChart2 className="w-3 h-3" />
                <span>Insights Dashboard</span>
              </button>
              <button
                onClick={() => setEditProfileModalOpen(true)}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white border border-stone-200 hover:border-orange-400 text-stone-800 transition active:scale-95 flex items-center gap-1 shadow-2xs"
              >
                <Edit3 className="w-3 h-3 text-orange-600" />
                <span>Rename / Edit</span>
              </button>
              <button
                onClick={() => setAccountSwitcherModalOpen(true)}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white border border-stone-200 hover:border-orange-400 text-stone-800 transition active:scale-95 flex items-center gap-1 shadow-2xs"
              >
                <Building2 className="w-3 h-3 text-orange-600" />
                <span>Switch Business</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Visual Engagement Summary (Line chart of 30-day likes & comments) */}
      <ProfileEngagementSummary profileId={profile.id} />

      {/* User Feedback Survey Widget */}
      <UserFeedbackSurveyWidget business={profile} />

      {/* Primary Section Switcher: Showcases vs Product Catalog vs Reviews */}
      <div className="flex items-center gap-1.5 mb-4 bg-stone-200/70 p-1 rounded-2xl border border-stone-200">
        <button
          onClick={() => setActiveProfileTab('showcases')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeProfileTab === 'showcases'
              ? 'bg-white text-stone-900 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
          <span>Showcases ({profile.posts_count || 0})</span>
        </button>

        <button
          onClick={() => setActiveProfileTab('catalog')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeProfileTab === 'catalog'
              ? 'bg-white text-orange-700 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Package className="w-3.5 h-3.5 text-orange-600" />
          <span>Catalog ({catalogProductsCount})</span>
        </button>

        <button
          onClick={() => setActiveProfileTab('reviews')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeProfileTab === 'reviews'
              ? 'bg-white text-stone-900 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
          <span>Reviews ({profile.review_count || 0})</span>
        </button>
      </div>

      {activeProfileTab === 'reviews' ? (
        <BusinessReviewsList business={profile} />
      ) : activeProfileTab === 'catalog' ? (
        <BusinessProductCatalog business={profile} isOwner={isOwner} />
      ) : (
        <>
          {/* 2. Media Type Filters & Layout Controls */}
          {canViewContent && (
            <div className="flex items-center justify-between gap-2 mb-4 bg-stone-100/70 p-1 rounded-xl">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMediaFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                mediaFilter === 'all'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setMediaFilter('video')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                mediaFilter === 'video'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Video className="w-3.5 h-3.5 text-orange-600" />
              <span>Videos</span>
            </button>
            <button
              onClick={() => setMediaFilter('image')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                mediaFilter === 'image'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5 text-orange-600" />
              <span>Photos</span>
            </button>
            <button
              onClick={() => setMediaFilter('audio')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                mediaFilter === 'audio'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Mic className="w-3.5 h-3.5 text-orange-600" />
              <span>Audio</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Popular vs Latest Sort Toggle */}
            <div className="flex items-center bg-stone-200/80 p-0.5 rounded-lg text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setProfileSort('latest')}
                className={`px-2 py-1 rounded-md transition ${
                  profileSort === 'latest'
                    ? 'bg-white text-stone-900 shadow-2xs font-bold'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                Latest
              </button>
              <button
                type="button"
                onClick={() => setProfileSort('popular')}
                className={`px-2 py-1 rounded-md transition flex items-center gap-1 ${
                  profileSort === 'popular'
                    ? 'bg-white text-orange-700 shadow-2xs font-bold'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
                title="Sort by lifetime likes & comments"
              >
                <Flame className="w-3 h-3 text-orange-600 fill-orange-500" />
                <span>Popular</span>
              </button>
              <button
                type="button"
                onClick={() => setProfileSort('performance')}
                className={`px-2 py-1 rounded-md transition flex items-center gap-1 ${
                  profileSort === 'performance'
                    ? 'bg-white text-purple-700 shadow-2xs font-bold'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
                title="Sort by 0-100 Performance Score to see highest resonating content"
              >
                <Zap className="w-3 h-3 text-purple-600 fill-purple-500" />
                <span>Score</span>
              </button>
            </div>

            <button
              onClick={() => setViewStyle('grid')}
              className={`p-1.5 rounded-lg transition ${
                viewStyle === 'grid' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500'
              }`}
              title="Grid"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 3. Content Display */}
      {canViewContent ? (
        posts.length > 0 ? (
          viewStyle === 'grid' ? (
            <div className="grid grid-cols-3 gap-2">
              {posts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => setSelectedPost(post)}
                  className="relative aspect-square rounded-xl overflow-hidden bg-stone-900 cursor-pointer group"
                >
                  {/* 0-100 Performance Score Badge */}
                  <div className="absolute top-1.5 left-1.5 z-10">
                    <PerformanceScoreBadge
                      post={post}
                      variant="mini"
                      showModalOnClick={true}
                    />
                  </div>

                  {post.media_type === 'image' && (
                    <img
                      src={post.media_url}
                      alt={post.caption}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  )}
                  {post.media_type === 'video' && (
                    <div className="w-full h-full relative">
                      <img
                        src={post.thumbnail_url || '/src/assets/images/coffee_roaster_1790587302699.jpg'}
                        alt="video"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center">
                        <Video className="w-3 h-3 text-orange-400" />
                      </div>
                    </div>
                  )}
                  {post.media_type === 'audio' && (
                    <div className="w-full h-full bg-stone-900 p-2 flex flex-col justify-between text-white">
                      <Mic className="w-4 h-4 text-orange-400" />
                      <p className="text-[10px] text-stone-300 line-clamp-2">{post.caption || 'Audio story'}</p>
                      <span className="text-[9px] font-mono text-stone-400">{post.duration || 60}s</span>
                    </div>
                  )}

                  {/* Popularity stats footer overlay */}
                  <div className="absolute bottom-0 inset-x-0 p-1.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between text-white text-[10px] font-mono">
                    <span className="flex items-center gap-1">
                      <Heart className="w-2.5 h-2.5 text-red-400 fill-red-400" />
                      <span>{post.like_count ?? post.likes_count ?? 0}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-2.5 h-2.5 text-stone-300" />
                      <span>{post.view_count || 0}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onEdit={onEditPost}
                  onReport={onReportPost}
                />
              ))}
            </div>
          )
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center text-stone-500">
            <p className="text-xs font-semibold text-stone-800">No showcases in this category yet</p>
            {isOwner && (
              <p className="text-[11px] text-stone-500 mt-1">Tap the (+) button below to add your first craft showcase.</p>
            )}
          </div>
        )
      ) : (
        /* Private Account Protected View */
        <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-700 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6 text-orange-600" />
          </div>
          <h3 className="font-display text-sm font-bold text-stone-900 mb-1">This Account is Private</h3>
          <p className="text-xs text-stone-500 max-w-xs mx-auto mb-4">
            Follow this business to request access to their photos, videos, and craft recordings.
          </p>
          <button
            onClick={handleFollowAction}
            className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-sm transition active:scale-95"
          >
            Request to Follow
          </button>
        </div>
      )}
      </>
      )}

      {/* Followers & Following Modal */}
      <FollowersModal
        profileId={profile.id}
        initialTab={followersModalTab}
        isOpen={followersModalOpen}
        onClose={() => setFollowersModalOpen(false)}
      />

      {/* Market QR Code & Tabletop Stand Modal */}
      <BusinessQRCodeModal
        profile={profile}
        isOpen={isQrModalOpen}
        onClose={() => setQrModalOpen(false)}
      />

      {/* Grid Showcase Lightbox / Detail Player Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl border border-stone-200">
            <button
              onClick={() => setSelectedPost(null)}
              className="absolute top-3 right-3 z-30 p-2 rounded-full bg-black/60 hover:bg-black text-white transition shadow-md"
              title="Close viewer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="max-h-[90vh] overflow-y-auto">
              <PostCard
                post={selectedPost}
                onEdit={(p) => {
                  setSelectedPost(null);
                  onEditPost(p);
                }}
                onReport={onReportPost}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
