import React, { useState } from 'react';
import { Compass, Sparkles, UserPlus, PlusCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PostCard } from './PostCard';
import { db } from '../../lib/mockEngine';
import { Post } from '../../types';

interface FeedViewProps {
  onEditPost: (post: Post) => void;
  onReportPost: (post: Post) => void;
}

export const FeedView: React.FC<FeedViewProps> = ({ onEditPost, onReportPost }) => {
  const { posts, currentUser, followUser, setActiveTab, openCreateModal, viewProfile } = useApp();
  const [displayCount, setDisplayCount] = useState(6);

  // Suggested businesses for empty following feed
  const allProfiles = db.getAllProfiles(currentUser?.id).filter((p) => p.id !== currentUser?.id);
  const visiblePosts = posts.slice(0, displayCount);

  return (
    <div className="max-w-xl mx-auto px-4 py-4 pb-24">
      {/* Feed greeting / artisan status banner */}
      <div className="mb-4 flex items-center justify-between text-xs text-stone-500 font-medium">
        <span>Showing showcases from businesses you follow</span>
        <button
          onClick={() => setActiveTab('discover')}
          className="text-orange-600 font-semibold hover:underline flex items-center gap-1"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Explore All</span>
        </button>
      </div>

      {visiblePosts.length > 0 ? (
        <div className="space-y-6">
          {visiblePosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onEdit={onEditPost}
              onReport={onReportPost}
            />
          ))}

          {posts.length > displayCount && (
            <div className="text-center pt-2">
              <button
                onClick={() => setDisplayCount((prev) => prev + 6)}
                className="px-5 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-800 text-xs font-semibold shadow-sm hover:bg-stone-50 transition active:scale-95"
              >
                Load More Showcases
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Friendly Empty State with Business Suggestions */
        <div className="rounded-2xl bg-white border border-stone-200 p-6 text-center shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="font-display text-base font-bold text-stone-900 mb-1">
            Your Following Feed is Quiet
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto mb-6">
            Follow local artisans and craft studios to see their daily roasting, baking, pottery, and bespoke creations.
          </p>

          <div className="text-left mb-6">
            <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-3">
              Recommended Businesses to Follow:
            </h4>
            <div className="space-y-3">
              {allProfiles.slice(0, 3).map((business) => (
                <div
                  key={business.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100 hover:border-stone-200 transition"
                >
                  <button
                    onClick={() => viewProfile(business.id)}
                    className="flex items-center gap-3 text-left min-w-0"
                  >
                    <img
                      src={business.avatar_url}
                      alt={business.business_name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover border border-stone-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-stone-900 truncate">{business.business_name}</p>
                      <p className="text-[11px] text-stone-500 truncate">{business.category}</p>
                    </div>
                  </button>

                  <button
                    onClick={() => followUser(business.id)}
                    className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shrink-0 flex items-center gap-1 transition active:scale-95"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Follow</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setActiveTab('discover')}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition"
            >
              Browse Discover Feed
            </button>
            <button
              onClick={openCreateModal}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-orange-50 text-orange-700 border border-orange-200 text-xs font-semibold hover:bg-orange-100 transition flex items-center justify-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Post Your Craft</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
