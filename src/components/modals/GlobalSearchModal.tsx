import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  X,
  MessageCircle,
  ShoppingBag,
  User,
  Building2,
  Users,
  Check,
  UserPlus,
  ShieldCheck,
  MapPin,
  Flame,
  ArrowRight,
  Coins,
  Sparkles,
  Tag,
  Star,
  DollarSign,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db } from '../../lib/mockEngine';
import { Profile, Post } from '../../types';
import { formatDistance } from '../../lib/locationData';

type SearchTab = 'all' | 'friends' | 'businesses' | 'products';

const QUICK_SUGGESTIONS = [
  { label: '☕ Arabica Coffee Beans', query: 'coffee beans', tab: 'products' as SearchTab },
  { label: '🏺 Hand-thrown Ceramics', query: 'ceramics pottery', tab: 'products' as SearchTab },
  { label: '👜 Artisan Leather Bags', query: 'leather bag', tab: 'products' as SearchTab },
  { label: '🍽️ Lake Victoria Tilapia', query: 'tilapia', tab: 'products' as SearchTab },
  { label: '👥 My Followers', query: '', tab: 'friends' as SearchTab },
  { label: '🏢 Roasters & Cafes', query: 'coffee roaster', tab: 'businesses' as SearchTab },
];

export const GlobalSearchModal: React.FC = () => {
  const {
    currentUser,
    isGlobalSearchOpen,
    closeGlobalSearch,
    globalSearchInitialTab,
    globalSearchQuery,
    setGlobalSearchQuery,
    businesses,
    posts,
    followUser,
    unfollowUser,
    viewProfile,
    setActiveTab,
    openChatWithUser,
    recordTransaction,
    showToast,
    openAuthModal,
  } = useApp();

  const [activeTab, setActiveTabFilter] = useState<SearchTab>(globalSearchInitialTab || 'all');
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Sync initial tab when modal opens
  useEffect(() => {
    if (isGlobalSearchOpen) {
      if (globalSearchInitialTab) setActiveTabFilter(globalSearchInitialTab);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isGlobalSearchOpen, globalSearchInitialTab]);

  // Followers & Following sets for current user
  const { followerIds, followingIds, mutualIds } = useMemo(() => {
    if (!currentUser) return { followerIds: new Set(), followingIds: new Set(), mutualIds: new Set() };
    const followers = db.getFollowers(currentUser.id, currentUser.id);
    const following = db.getFollowing(currentUser.id, currentUser.id);

    const fSet = new Set(followers.map((p) => p.id));
    const flSet = new Set(following.map((p) => p.id));
    const mSet = new Set([...fSet].filter((id) => flSet.has(id)));

    return { followerIds: fSet, followingIds: flSet, mutualIds: mSet };
  }, [currentUser?.id]);

  const query = globalSearchQuery.trim().toLowerCase();

  // 1. Friends & Followers matching
  const matchedFriends = useMemo(() => {
    const list = businesses.filter((p) => {
      if (p.id === currentUser?.id) return false;
      const isFriendOrFollower = followerIds.has(p.id) || followingIds.has(p.id);
      if (!isFriendOrFollower && activeTab === 'friends') return false;

      if (!query) return isFriendOrFollower;
      return (
        p.business_name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        p.bio.toLowerCase().includes(query) ||
        (p.location && p.location.toLowerCase().includes(query)) ||
        (p.city && p.city.toLowerCase().includes(query))
      );
    });

    return list;
  }, [businesses, currentUser?.id, followerIds, followingIds, query, activeTab]);

  // 2. Businesses matching
  const matchedBusinesses = useMemo(() => {
    if (activeTab === 'friends' || activeTab === 'products') return [];

    return businesses.filter((b) => {
      if (b.id === currentUser?.id) return false;
      if (!query) return true;
      return (
        b.business_name.toLowerCase().includes(query) ||
        b.category.toLowerCase().includes(query) ||
        b.bio.toLowerCase().includes(query) ||
        (b.location && b.location.toLowerCase().includes(query)) ||
        (b.city && b.city.toLowerCase().includes(query)) ||
        (b.district && b.district.toLowerCase().includes(query))
      );
    });
  }, [businesses, currentUser?.id, query, activeTab]);

  // 3. Products & Crafts for Buy / Sell matching
  const matchedProducts = useMemo(() => {
    if (activeTab === 'friends' || activeTab === 'businesses') return [];

    return posts.filter((p) => {
      if (p.is_deleted) return false;
      if (!query) return true;
      const caption = p.caption ? p.caption.toLowerCase() : '';
      const authorName = p.user?.business_name ? p.user.business_name.toLowerCase() : '';
      const authorCat = p.user?.category ? p.user.category.toLowerCase() : '';
      const loc = p.location ? p.location.toLowerCase() : '';

      return (
        caption.includes(query) ||
        authorName.includes(query) ||
        authorCat.includes(query) ||
        loc.includes(query)
      );
    });
  }, [posts, query, activeTab]);

  if (!isGlobalSearchOpen) return null;

  const handleStartChatToBuyOrSell = (partnerId: string, itemTitle?: string) => {
    closeGlobalSearch();
    openChatWithUser(partnerId);

    if (itemTitle) {
      showToast(`Started conversation regarding "${itemTitle}". Send a message to buy or sell!`, 'info');
    }
  };

  const handleQuickPurchase = async (post: Post) => {
    if (!currentUser) {
      openAuthModal();
      return;
    }
    if (!post.user) return;

    try {
      const itemTitle = post.caption ? `${post.caption.slice(0, 35)}...` : 'Artisan Craft Order';
      await recordTransaction({
        buyer_id: currentUser.id,
        seller_id: post.user.id,
        item_type: 'craft_order',
        item_title: itemTitle,
        post_id: post.id,
        amount_cents: 3500, // $35.00
        payment_method: 'credit_card',
        status: 'settled',
        notes: `Global Search purchase order from post #${post.id}`,
      });
      showToast(`Order for $35.00 placed with ${post.user.business_name}! Recorded in ledger.`, 'success');
      closeGlobalSearch();
      setActiveTab('admin');
    } catch (err: any) {
      showToast(err.message || 'Transaction failed', 'error');
    }
  };

  const handleFollowToggle = (profile: Profile) => {
    if (!currentUser) {
      openAuthModal();
      return;
    }
    if (profile.is_following) {
      unfollowUser(profile.id);
    } else {
      followUser(profile.id);
    }
  };

  const totalResults =
    activeTab === 'all'
      ? matchedFriends.length + matchedBusinesses.length + matchedProducts.length
      : activeTab === 'friends'
      ? matchedFriends.length
      : activeTab === 'businesses'
      ? matchedBusinesses.length
      : matchedProducts.length;

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-start sm:items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] shadow-2xl border border-stone-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        {/* Search Header */}
        <div className="p-3 sm:p-4 border-b border-stone-100 bg-stone-50/80">
          <div className="relative flex items-center">
            <Search className="w-5 h-5 text-stone-400 absolute left-3.5 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={globalSearchQuery}
              onChange={(e) => setGlobalSearchQuery(e.target.value)}
              placeholder="Search followers, friends, businesses, or products to buy & sell..."
              className="w-full pl-11 pr-16 py-3 bg-white border border-stone-200 rounded-2xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-2xs transition"
            />
            {globalSearchQuery && (
              <button
                onClick={() => setGlobalSearchQuery('')}
                className="absolute right-10 p-1 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={closeGlobalSearch}
              className="absolute right-3 p-1 rounded-lg text-stone-400 hover:text-stone-700 text-xs font-bold"
              title="Close (Esc)"
            >
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-stone-100 border border-stone-200 rounded text-stone-500">
                ESC
              </kbd>
            </button>
          </div>

          {/* Tab Filter Pills */}
          <div className="flex items-center gap-1.5 mt-3 overflow-x-auto no-scrollbar pt-0.5">
            {[
              { id: 'all', label: 'All Results' },
              { id: 'friends', label: '👥 Friends & Followers' },
              { id: 'businesses', label: '🏢 Businesses & Artisans' },
              { id: 'products', label: '🛍️ Products & Crafts (Buy/Sell)' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTabFilter(tab.id as SearchTab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition active:scale-95 ${
                  activeTab === tab.id
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Body */}
        <div className="overflow-y-auto p-4 space-y-4 flex-1">
          {/* Quick Suggestions when query is empty */}
          {!globalSearchQuery && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-orange-600" />
                <span>Suggested Searches & Direct Inquiries</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_SUGGESTIONS.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setGlobalSearchQuery(s.query);
                      setActiveTabFilter(s.tab);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-orange-50 hover:text-orange-900 border border-stone-200/80 text-xs font-medium text-stone-700 transition active:scale-95"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results Summary Bar */}
          <div className="flex items-center justify-between text-[11px] text-stone-500 pb-1 border-b border-stone-100">
            <span>
              Found <strong className="text-stone-900">{totalResults}</strong> matching results
            </span>
            <span className="text-orange-600 font-medium">1-Click Direct Inbox & Buy enabled</span>
          </div>

          {/* SECTION 1: FRIENDS & FOLLOWERS */}
          {(activeTab === 'all' || activeTab === 'friends') && matchedFriends.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-orange-600" />
                <span>Friends & Followers ({matchedFriends.length})</span>
              </h3>

              <div className="space-y-2">
                {matchedFriends.slice(0, activeTab === 'all' ? 4 : 20).map((friend) => {
                  const isMutual = mutualIds.has(friend.id);
                  const isFollower = followerIds.has(friend.id);
                  const isFollowing = followingIds.has(friend.id);

                  return (
                    <div
                      key={friend.id}
                      className="p-3 rounded-2xl border border-stone-200 hover:border-orange-300 bg-white transition shadow-2xs flex items-center justify-between gap-3 group"
                    >
                      <div
                        onClick={() => {
                          closeGlobalSearch();
                          viewProfile(friend.id);
                        }}
                        className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                      >
                        <img
                          src={friend.avatar_url}
                          alt={friend.business_name}
                          className="w-10 h-10 rounded-xl object-cover border border-stone-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-stone-900 group-hover:text-orange-600 transition truncate">
                              {friend.business_name}
                            </span>
                            {friend.is_verified && (
                              <ShieldCheck className="w-3 h-3 text-blue-600 fill-blue-100" />
                            )}
                            <span className="px-1.5 py-0.2 rounded-md bg-stone-100 text-[10px] font-semibold text-stone-600">
                              {isMutual ? '🤝 Mutual Friend' : isFollower ? 'Follows you' : 'Following'}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-500 truncate mt-0.5">
                            {friend.category} • {friend.location || friend.city}
                          </p>
                        </div>
                      </div>

                      {/* Direct Actions: Inbox & Buy */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleStartChatToBuyOrSell(friend.id)}
                          className="px-2.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-2xs transition active:scale-95 flex items-center gap-1"
                          title="Direct message to buy, sell, or coordinate"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Inbox</span>
                        </button>

                        <button
                          onClick={() => handleFollowToggle(friend)}
                          className={`p-1.5 rounded-xl border text-xs font-semibold transition ${
                            friend.is_following
                              ? 'border-stone-200 text-stone-600 hover:bg-stone-100'
                              : 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100'
                          }`}
                          title={friend.is_following ? 'Following' : 'Follow'}
                        >
                          {friend.is_following ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <UserPlus className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 2: BUSINESSES & ARTISANS */}
          {(activeTab === 'all' || activeTab === 'businesses') && matchedBusinesses.length > 0 && (
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-orange-600" />
                <span>Artisan Businesses & Makers ({matchedBusinesses.length})</span>
              </h3>

              <div className="space-y-2">
                {matchedBusinesses.slice(0, activeTab === 'all' ? 4 : 20).map((b) => (
                  <div
                    key={b.id}
                    className="p-3 rounded-2xl border border-stone-200 hover:border-orange-300 bg-white transition shadow-2xs flex items-center justify-between gap-3 group"
                  >
                    <div
                      onClick={() => {
                        closeGlobalSearch();
                        viewProfile(b.id);
                      }}
                      className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                    >
                      <img
                        src={b.avatar_url}
                        alt={b.business_name}
                        className="w-10 h-10 rounded-xl object-cover border border-stone-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-stone-900 group-hover:text-orange-600 transition truncate">
                            {b.business_name}
                          </span>
                          {b.is_verified && (
                            <ShieldCheck className="w-3 h-3 text-blue-600 fill-blue-100" />
                          )}
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-900 border border-amber-200 font-semibold">
                            {b.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 truncate mt-0.5">
                          {b.location || b.city}
                          {b.rating && b.rating > 0 && ` • ⭐ ${b.rating.toFixed(1)}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleStartChatToBuyOrSell(b.id)}
                        className="px-2.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-2xs transition active:scale-95 flex items-center gap-1"
                        title="Direct message this business"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Inbox</span>
                      </button>

                      <button
                        onClick={() => {
                          closeGlobalSearch();
                          viewProfile(b.id);
                        }}
                        className="px-2.5 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-xs font-semibold text-stone-700 transition"
                      >
                        Profile
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 3: PRODUCTS & CRAFTS TO BUY / SELL */}
          {(activeTab === 'all' || activeTab === 'products') && matchedProducts.length > 0 && (
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-orange-600" />
                <span>Products & Showcases for Buy & Sell ({matchedProducts.length})</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {matchedProducts.slice(0, activeTab === 'all' ? 4 : 20).map((prod) => (
                  <div
                    key={prod.id}
                    className="p-3 rounded-2xl border border-stone-200 hover:border-orange-300 bg-white transition shadow-2xs flex flex-col justify-between space-y-2.5 group"
                  >
                    <div className="flex items-start gap-2.5">
                      <img
                        src={prod.media_url || prod.thumbnail_url || prod.user?.avatar_url}
                        alt=""
                        className="w-14 h-14 rounded-xl object-cover border border-stone-200 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 text-[11px] text-stone-500">
                          <span className="font-bold text-stone-900 truncate">
                            {prod.user?.business_name}
                          </span>
                        </div>
                        <p className="text-xs text-stone-800 line-clamp-2 mt-0.5 leading-snug">
                          {prod.caption}
                        </p>
                      </div>
                    </div>

                    {/* Actions: Direct Inbox to Buy or Quick Buy */}
                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-1.5">
                      <button
                        onClick={() =>
                          prod.user &&
                          handleStartChatToBuyOrSell(prod.user.id, prod.caption.slice(0, 30))
                        }
                        className="flex-1 py-1.5 px-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 text-xs font-semibold transition active:scale-95 flex items-center justify-center gap-1"
                        title="Message artisan directly about buying this product"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-orange-600" />
                        <span>Inbox to Buy</span>
                      </button>

                      <button
                        onClick={() => handleQuickPurchase(prod)}
                        className="py-1.5 px-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-2xs transition active:scale-95 flex items-center justify-center gap-1"
                        title="Instant order via PostgreSQL ledger"
                      >
                        <Coins className="w-3.5 h-3.5" />
                        <span>Order ($35)</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {totalResults === 0 && (
            <div className="py-12 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-stone-900">No matching results found</h4>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">
                Try searching for coffee beans, ceramics, leather, tilapia, or search for a specific friend or business name.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
