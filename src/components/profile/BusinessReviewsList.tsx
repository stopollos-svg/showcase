import React, { useState } from 'react';
import {
  Star,
  ThumbsUp,
  Trash2,
  ShieldCheck,
  Tag,
  PenSquare,
  Sparkles,
  MessageCircle,
  Filter,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BusinessReview, Profile } from '../../types';

interface BusinessReviewsListProps {
  business: Profile;
}

export const BusinessReviewsList: React.FC<BusinessReviewsListProps> = ({ business }) => {
  const {
    getBusinessReviews,
    voteReviewHelpful,
    deleteBusinessReview,
    openWriteReviewModal,
    currentUser,
  } = useApp();

  const reviews = getBusinessReviews(business.id);
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('all');
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<number | 'all'>('all');

  // Compute breakdown
  const totalReviews = reviews.length;
  const avgRating =
    totalReviews > 0
      ? Math.round((reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews) * 10) / 10
      : business.rating || 5.0;

  const starCounts = [5, 4, 3, 2, 1].map((s) => ({
    star: s,
    count: reviews.filter((r) => r.rating === s).length,
    percentage:
      totalReviews > 0 ? (reviews.filter((r) => r.rating === s).length / totalReviews) * 100 : 0,
  }));

  // Unique tags across all reviews
  const allTags = Array.from(new Set(reviews.flatMap((r) => r.tags || [])));

  // Filter reviews by tag and rating
  const filteredReviews = reviews.filter((r) => {
    const matchesTag = selectedTagFilter === 'all' || r.tags?.includes(selectedTagFilter);
    const matchesRating = selectedRatingFilter === 'all' || r.rating === selectedRatingFilter;
    return matchesTag && matchesRating;
  });

  const isOwner = currentUser?.id === business.id;
  const hasActiveFilters = selectedTagFilter !== 'all' || selectedRatingFilter !== 'all';

  return (
    <div className="space-y-4">
      {/* 1. Rating Summary & Action Card */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          {/* Average Rating Score */}
          <div className="sm:col-span-5 text-center sm:text-left sm:border-r sm:border-stone-100 sm:pr-4">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="font-mono text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
                {avgRating.toFixed(1)}
              </span>
              <div>
                <div className="flex items-center text-amber-400">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${
                        s <= Math.round(avgRating)
                          ? 'fill-amber-400 text-amber-500'
                          : 'fill-stone-100 text-stone-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-stone-500 mt-0.5 font-medium">
                  {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'} & ratings
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-600 mt-2 line-clamp-2">
              Customer reviews for {business.business_name} in {business.district || business.city || 'Kampala'}.
            </p>

            {!isOwner && (
              <button
                onClick={() => openWriteReviewModal(business.id)}
                className="mt-3.5 w-full sm:w-auto px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                <PenSquare className="w-3.5 h-3.5" />
                <span>Write a Review</span>
              </button>
            )}
          </div>

          {/* Star Distribution Breakdown with Interactive Filter */}
          <div className="sm:col-span-7 space-y-1.5">
            {starCounts.map(({ star, count, percentage }) => {
              const isSelected = selectedRatingFilter === star;
              return (
                <button
                  key={star}
                  onClick={() => setSelectedRatingFilter(isSelected ? 'all' : star)}
                  className={`w-full flex items-center gap-2 text-xs transition p-1 rounded-lg text-left ${
                    isSelected ? 'bg-amber-100/70 font-bold' : 'hover:bg-stone-50'
                  }`}
                  title={`Filter by ${star} star reviews`}
                >
                  <span className="w-6 font-mono font-bold text-right text-[11px] text-stone-700">
                    {star}★
                  </span>
                  <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-6 font-mono text-[10px] text-stone-400 text-right">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Auto-Suggested Tag & Rating Filter Chips */}
      {(allTags.length > 0 || hasActiveFilters) && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-stone-500 px-1">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-orange-600" />
              <span>Auto-Suggested Topics & Filter Tags:</span>
            </span>
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setSelectedTagFilter('all');
                  setSelectedRatingFilter('all');
                }}
                className="text-orange-600 hover:text-orange-800 text-[10px] font-semibold flex items-center gap-0.5 lowercase"
              >
                <X className="w-2.5 h-2.5" />
                <span>reset filters</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => {
                setSelectedTagFilter('all');
                setSelectedRatingFilter('all');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                !hasActiveFilters
                  ? 'bg-stone-900 text-white shadow-2xs font-semibold'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              All ({totalReviews})
            </button>

            {/* Rating Filter Pills */}
            {[5, 4, 3].map((star) => (
              <button
                key={star}
                onClick={() => setSelectedRatingFilter(selectedRatingFilter === star ? 'all' : star)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition whitespace-nowrap flex items-center gap-1 border ${
                  selectedRatingFilter === star
                    ? 'bg-amber-500 text-white border-amber-500 font-semibold shadow-2xs'
                    : 'bg-white text-stone-700 border-stone-200 hover:bg-amber-50/50'
                }`}
              >
                <Star className={`w-3 h-3 ${selectedRatingFilter === star ? 'fill-white' : 'fill-amber-400 text-amber-500'}`} />
                <span>{star} Stars</span>
              </button>
            ))}

            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTagFilter(selectedTagFilter === tag ? 'all' : tag)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition whitespace-nowrap flex items-center gap-1 border ${
                  selectedTagFilter === tag
                    ? 'bg-orange-600 text-white border-orange-600 font-semibold shadow-2xs'
                    : 'bg-white text-stone-700 border-stone-200 hover:border-orange-300 hover:bg-orange-50/50'
                }`}
              >
                <Tag className="w-3 h-3 text-orange-500" />
                <span>{tag}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. Reviews List */}
      {filteredReviews.length > 0 ? (
        <div className="space-y-3">
          {filteredReviews.map((review) => {
            const isReviewAuthor = currentUser?.id === review.user_id;
            return (
              <div
                key={review.id}
                className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs space-y-2.5 transition hover:border-stone-300"
              >
                {/* Review Header: User info, rating, and date */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {review.author_avatar ? (
                      <img
                        src={review.author_avatar}
                        alt={review.author_name}
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded-full object-cover border border-stone-200 shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {review.author_name[0] || 'R'}
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs text-stone-900 truncate">
                          {review.author_name}
                        </span>
                        {review.is_verified_patron && (
                          <span
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 text-[10px] font-semibold border border-emerald-200"
                            title="Verified patron visit"
                          >
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>Verified Patron</span>
                          </span>
                        )}
                      </div>

                      {/* Stars & Date */}
                      <div className="flex items-center gap-1.5 text-[11px] text-stone-400 mt-0.5">
                        <div className="flex items-center text-amber-400">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${
                                s <= review.rating
                                  ? 'fill-amber-400 text-amber-500'
                                  : 'fill-stone-100 text-stone-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span>•</span>
                        <span>{new Date(review.created_at).toLocaleDateString()}</span>
                        {review.visit_date && (
                          <>
                            <span>•</span>
                            <span className="italic">{review.visit_date}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {isReviewAuthor && (
                    <button
                      onClick={() => deleteBusinessReview(review.id)}
                      className="p-1 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition"
                      title="Delete your review"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Review Content */}
                <div>
                  <h4 className="text-xs font-bold text-stone-900 mb-1">{review.title}</h4>
                  <p className="text-xs text-stone-700 leading-relaxed">{review.comment}</p>
                </div>

                {/* Tags attached to review */}
                {review.tags && review.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {review.tags.map((tag) => (
                      <span
                        key={tag}
                        onClick={() => setSelectedTagFilter(tag)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 text-[10px] font-medium hover:bg-orange-50 hover:text-orange-700 cursor-pointer transition"
                      >
                        <Tag className="w-2.5 h-2.5 text-stone-400" />
                        <span>{tag}</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Review Footer: Helpful votes */}
                <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
                  <button
                    onClick={() => voteReviewHelpful(review.id)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-stone-100 text-stone-600 hover:text-stone-900 transition text-[11px] font-medium active:scale-95"
                  >
                    <ThumbsUp className="w-3 h-3 text-stone-500" />
                    <span>Helpful ({review.helpful_votes || 0})</span>
                  </button>
                  <span className="text-[10px] text-stone-400">Community verified</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-stone-200 p-8 text-center text-stone-500 shadow-2xs">
          <MessageCircle className="w-8 h-8 text-stone-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-stone-700">No reviews found</p>
          <p className="text-[11px] text-stone-400 mt-0.5">
            {hasActiveFilters
              ? 'Try selecting another tag or clearing the filter.'
              : 'Be the first to share your experience with this artisan business!'}
          </p>
          {hasActiveFilters ? (
            <button
              onClick={() => {
                setSelectedTagFilter('all');
                setSelectedRatingFilter('all');
              }}
              className="mt-3 px-3.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition"
            >
              Clear Filter
            </button>
          ) : (
            !isOwner && (
              <button
                onClick={() => openWriteReviewModal(business.id)}
                className="mt-3.5 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-xs transition active:scale-95 inline-flex items-center gap-1.5"
              >
                <PenSquare className="w-3.5 h-3.5" />
                <span>Write the First Review</span>
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
};
