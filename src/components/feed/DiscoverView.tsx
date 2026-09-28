import React, { useState } from 'react';
import { Search, X, Grid, List, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PostCard } from './PostCard';
import { BUSINESS_CATEGORIES, Post } from '../../types';
import { db } from '../../lib/mockEngine';

interface DiscoverViewProps {
  onEditPost: (post: Post) => void;
  onReportPost: (post: Post) => void;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({ onEditPost, onReportPost }) => {
  const {
    posts,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    viewProfile,
    currentUser,
  } = useApp();

  const [viewLayout, setViewLayout] = useState<'stream' | 'grid'>('stream');

  // Featured business profiles for quick discovery
  const featuredBusinesses = db.getAllProfiles(currentUser?.id);

  return (
    <div className="max-w-xl mx-auto px-4 py-4 pb-24">
      {/* 1. Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search businesses, crafts, or captions..."
          className="w-full pl-10 pr-9 py-2.5 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-sm transition"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 2. Interactive Segmented Category Filter Bar */}
      <div className="mb-4 overflow-x-auto no-scrollbar py-1">
        <div className="flex items-center gap-1.5 min-w-max">
          {BUSINESS_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition active:scale-95 whitespace-nowrap ${
                  isSelected
                    ? 'bg-stone-900 text-white shadow-sm'
                    : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Horizontal Artisan Business Spotlight Carousel */}
      {!searchQuery && selectedCategory === 'all' && (
        <section className="mb-6">
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-orange-600" />
              <span>Artisan Spotlight</span>
            </h2>
            <span className="text-[11px] text-stone-500">{featuredBusinesses.length} studios</span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2 pt-1">
            {featuredBusinesses.map((business) => (
              <button
                key={business.id}
                onClick={() => viewProfile(business.id)}
                className="flex-shrink-0 w-36 p-3 rounded-2xl bg-white border border-stone-200/90 shadow-sm text-center hover:border-orange-300 transition group active:scale-95"
              >
                <div className="relative mx-auto w-14 h-14 mb-2">
                  <img
                    src={business.avatar_url}
                    alt={business.business_name}
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-full object-cover border border-stone-200 group-hover:ring-2 group-hover:ring-orange-200 transition"
                  />
                  {business.is_private && (
                    <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-stone-800 text-white text-[9px] flex items-center justify-center font-bold">
                      🔒
                    </span>
                  )}
                </div>

                <p className="text-xs font-bold text-stone-900 truncate group-hover:text-orange-600 transition-colors">
                  {business.business_name}
                </p>
                <p className="text-[10px] text-stone-500 truncate mt-0.5">{business.category}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 4. Layout Switch & Result Count Header */}
      <div className="flex items-center justify-between mb-3 text-xs text-stone-500">
        <span>
          {posts.length} {posts.length === 1 ? 'showcase' : 'showcases'} found
        </span>

        <div className="flex items-center gap-1 bg-stone-200/60 p-0.5 rounded-lg">
          <button
            onClick={() => setViewLayout('stream')}
            className={`p-1.5 rounded-md transition ${
              viewLayout === 'stream' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'
            }`}
            title="Stream View"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewLayout('grid')}
            className={`p-1.5 rounded-md transition ${
              viewLayout === 'grid' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'
            }`}
            title="Grid View"
          >
            <Grid className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 5. Posts Presentation */}
      {posts.length > 0 ? (
        viewLayout === 'stream' ? (
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
        ) : (
          /* Grid View */
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {posts.map((post) => (
              <div
                key={post.id}
                onClick={() => setViewLayout('stream')}
                className="group relative aspect-square rounded-xl overflow-hidden bg-stone-900 cursor-pointer border border-stone-200"
              >
                {post.media_type === 'image' && (
                  <img
                    src={post.media_url}
                    alt={post.caption}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                )}
                {post.media_type === 'video' && (
                  <div className="w-full h-full relative">
                    <img
                      src={post.thumbnail_url || '/src/assets/images/coffee_roaster_1790587302699.jpg'}
                      alt="video thumbnail"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-white text-[10px] font-mono">
                      VIDEO
                    </div>
                  </div>
                )}
                {post.media_type === 'audio' && (
                  <div className="w-full h-full bg-stone-900 p-3 flex flex-col justify-between text-white">
                    <span className="text-[10px] text-orange-400 font-mono">AUDIO</span>
                    <p className="text-xs font-semibold line-clamp-3">{post.caption || 'Audio Story'}</p>
                    <span className="text-[10px] text-stone-400 font-mono">{post.duration || 60}s</span>
                  </div>
                )}

                {/* Subtle Hover overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end text-white">
                  <p className="text-[11px] font-bold truncate">{post.user?.business_name}</p>
                  <p className="text-[10px] text-stone-200 line-clamp-1">{post.caption}</p>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="rounded-2xl bg-white border border-stone-200 p-8 text-center text-stone-500">
          <p className="text-sm font-semibold text-stone-700">No showcases found</p>
          <p className="text-xs mt-1">Try another category or clear your search term.</p>
        </div>
      )}
    </div>
  );
};
