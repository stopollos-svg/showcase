import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  Sparkles,
  Check,
  Tag,
  MessageSquare,
  Building2,
  ChevronRight,
  ShieldCheck,
  Plus,
  Wand2,
  Calendar,
  ThumbsUp,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db } from '../../lib/mockEngine';
import { REVIEW_SUGGESTIONS_BY_CATEGORY } from '../../types';

export const WriteReviewModal: React.FC = () => {
  const {
    isWriteReviewModalOpen,
    reviewTargetBusinessId,
    closeWriteReviewModal,
    addBusinessReview,
    currentUser,
  } = useApp();

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [visitDate, setVisitDate] = useState('This week');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoDraftNotice, setAutoDraftNotice] = useState<string | null>(null);

  // Target business profile
  const targetBusiness = reviewTargetBusinessId ? db.getProfile(reviewTargetBusinessId) : null;

  // Category auto-suggestions
  const categoryKey = targetBusiness?.category?.toLowerCase() || 'default';
  const suggestionData =
    REVIEW_SUGGESTIONS_BY_CATEGORY[categoryKey] || REVIEW_SUGGESTIONS_BY_CATEGORY.default;

  useEffect(() => {
    if (isWriteReviewModalOpen) {
      setRating(5);
      setHoverRating(null);
      setTitle('');
      setComment('');
      setSelectedTags([]);
      setCustomTagInput('');
      setVisitDate('This week');
      setAutoDraftNotice(null);
    }
  }, [isWriteReviewModalOpen, reviewTargetBusinessId]);

  if (!isWriteReviewModalOpen || !targetBusiness) return null;

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddCustomTag = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customTagInput.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags([...selectedTags, trimmed]);
      setCustomTagInput('');
    }
  };

  const handleApplySentenceStarter = (starter: string) => {
    if (!comment) {
      setComment(starter + ' ');
    } else {
      setComment((prev) => prev.trim() + ' ' + starter + ' ');
    }
  };

  // Smart Auto-Suggest Review Generator
  const handleAutoDraftReview = () => {
    const bName = targetBusiness.business_name;
    const bLoc = targetBusiness.district || targetBusiness.city || 'Kampala';
    const bCat = targetBusiness.category.toLowerCase();
    const primaryTag = selectedTags.length > 0 ? selectedTags[0] : (suggestionData.tags[0] || 'Artisan Craft');
    const secondaryTag = selectedTags.length > 1 ? selectedTags[1] : (suggestionData.tags[1] || 'Warm Hospitality');

    // Auto-select tags if none selected
    if (selectedTags.length === 0 && suggestionData.tags.length >= 2) {
      setSelectedTags([suggestionData.tags[0], suggestionData.tags[1]]);
    }

    if (rating === 5) {
      if (bCat.includes('coffee')) {
        setTitle(`Outstanding ${primaryTag} and impeccable barista craft`);
        setComment(
          `Visited ${bName} in ${bLoc} and had an exceptional experience. The ${primaryTag.toLowerCase()} had incredible clarity and balanced acidity. Pair that with their ${secondaryTag.toLowerCase()} and warm hospitality, this is truly a gem for specialty coffee patrons.`
        );
      } else if (bCat.includes('restaurant')) {
        setTitle(`Magnificent ${primaryTag} under the garden canopy`);
        setComment(
          `An unforgettable meal at ${bName} in ${bLoc}. The ${primaryTag.toLowerCase()} was cooked to perfection with vibrant seasonings. Enjoyed the ${secondaryTag.toLowerCase()} and the serene outdoor atmosphere. Will be returning frequently with friends and family!`
        );
      } else if (bCat.includes('event')) {
        setTitle(`Unrivaled ${primaryTag} with vibrant cultural community`);
        setComment(
          `${bName} delivered an electric gathering in ${bLoc}. Loved the ${primaryTag.toLowerCase()} and the ${secondaryTag.toLowerCase()}. Inspiring to see authentic Ugandan creators and artisans brought together in such a creative, welcoming environment.`
        );
      } else if (bCat.includes('hangout')) {
        setTitle(`Incredible ${primaryTag} in an inspiring creative haven`);
        setComment(
          `A sanctuary for creativity in ${bLoc}. Spent the afternoon at ${bName} enjoying the ${primaryTag.toLowerCase()} and ${secondaryTag.toLowerCase()}. Superb vibe, peaceful spaces to reflect or collaborate, and wonderful hospitality.`
        );
      } else {
        setTitle(`Exceptional ${primaryTag} and master artisan dedication`);
        setComment(
          `Stunning dedication to master craft at ${bName}. The attention to detail regarding ${primaryTag.toLowerCase()} and ${secondaryTag.toLowerCase()} sets them apart in ${bLoc}. Outstanding quality that deserves community praise!`
        );
      }
    } else if (rating === 4) {
      setTitle(`Very impressive ${primaryTag} with great local character`);
      setComment(
        `Really enjoyed my visit to ${bName} in ${bLoc}. The ${primaryTag.toLowerCase()} was well executed, and the ${secondaryTag.toLowerCase()} added great character to the space. Friendly staff and welcoming vibe overall.`
      );
    } else if (rating === 3) {
      setTitle(`Solid potential with pleasant ${secondaryTag.toLowerCase()}`);
      setComment(
        `Visited ${bName} in ${bLoc}. The ${secondaryTag.toLowerCase()} was pleasant, though there is slight room to elevate the ${primaryTag.toLowerCase()}. A solid local spot with good promise.`
      );
    } else {
      setTitle(`Experience at ${bName} had room for improvement`);
      setComment(
        `Visited ${bName} in ${bLoc} recently. While the location is convenient, the quality and service fell short of expectations on this visit.`
      );
    }

    setAutoDraftNotice('✨ Review draft auto-generated from your rating & tags! You can edit freely.');
    setTimeout(() => setAutoDraftNotice(null), 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !comment.trim()) return;

    setIsSubmitting(true);
    try {
      await addBusinessReview({
        business_id: targetBusiness.id,
        rating,
        title: title.trim(),
        comment: comment.trim(),
        tags: selectedTags,
      });
      closeWriteReviewModal();
    } finally {
      setIsSubmitting(false);
    }
  };

  const ratingLabels: Record<number, string> = {
    1: 'Poor Experience',
    2: 'Fair / Needs Improvement',
    3: 'Good / Solid Craft',
    4: 'Very Good / Highly Enjoyable',
    5: 'Exceptional / Master Craft',
  };

  const currentDisplayRating = hoverRating || rating;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={targetBusiness.avatar_url}
              alt={targetBusiness.business_name}
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full object-cover border border-stone-200 shrink-0"
            />
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-stone-900 truncate flex items-center gap-1">
                <span>Review {targetBusiness.business_name}</span>
                {targetBusiness.is_verified && (
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600 inline fill-blue-100 shrink-0" />
                )}
              </h2>
              <p className="text-[11px] text-stone-500 truncate">
                {targetBusiness.category} • {targetBusiness.location || targetBusiness.city || 'Kampala'}
              </p>
            </div>
          </div>

          <button
            onClick={closeWriteReviewModal}
            className="p-1.5 rounded-xl hover:bg-stone-200 text-stone-400 hover:text-stone-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-4 text-xs">
          {/* 1. Star Rating Picker */}
          <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 text-center">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-amber-900 mb-2">
              Overall Rating
            </label>

            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = star <= currentDisplayRating;
                return (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    onClick={() => setRating(star)}
                    className="p-1 transition-transform hover:scale-125 active:scale-95 focus:outline-none"
                  >
                    <Star
                      className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                        filled
                          ? 'fill-amber-400 text-amber-500'
                          : 'fill-stone-100 text-stone-300'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <p className="text-xs font-semibold text-amber-800 mt-2">
              {ratingLabels[currentDisplayRating]} ({currentDisplayRating} of 5 stars)
            </p>
          </div>

          {/* 2. Smart Review Auto-Suggestions */}
          <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-200/90 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                <span>Auto-Suggested Tags ({targetBusiness.category}):</span>
              </span>
              <button
                type="button"
                onClick={handleAutoDraftReview}
                className="px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-[11px] font-semibold flex items-center gap-1 shadow-2xs transition active:scale-95"
                title="Automatically draft review headline and comment from your rating and tags"
              >
                <Wand2 className="w-3 h-3" />
                <span>Auto-Draft Review</span>
              </button>
            </div>

            {/* Tag suggestions */}
            <div className="flex flex-wrap gap-1.5">
              {suggestionData.tags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleTag(tag)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition active:scale-95 flex items-center gap-1 ${
                      isSelected
                        ? 'bg-orange-600 text-white shadow-2xs font-semibold'
                        : 'bg-white text-stone-700 border border-stone-200 hover:border-orange-300 hover:bg-orange-50/50'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                    <span>{tag}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Tag Input */}
            <div className="flex items-center gap-1.5 pt-1">
              <input
                type="text"
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomTag();
                  }
                }}
                placeholder="Add custom tag (e.g. 'Garden seating')..."
                className="flex-1 px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-[11px] text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-orange-500"
              />
              <button
                type="button"
                onClick={() => handleAddCustomTag()}
                className="px-2.5 py-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 text-[11px] font-semibold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add</span>
              </button>
            </div>

            {/* Sentence starter suggestions */}
            {suggestionData.sentenceStarters.length > 0 && (
              <div className="pt-2 border-t border-stone-200/60">
                <p className="text-[10px] text-stone-500 font-semibold mb-1 flex items-center justify-between">
                  <span>💡 Auto-suggest prompt starters (tap to add to review):</span>
                  <span className="text-orange-600 font-medium">Click to insert</span>
                </p>
                <div className="space-y-1">
                  {suggestionData.sentenceStarters.slice(0, 3).map((starter, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplySentenceStarter(starter)}
                      className="w-full text-left p-1.5 rounded-lg bg-white border border-stone-200/80 hover:border-orange-300 hover:bg-orange-50/40 text-[11px] text-stone-600 flex items-center justify-between group transition"
                    >
                      <span className="truncate italic">"{starter}..."</span>
                      <ChevronRight className="w-3 h-3 text-stone-400 group-hover:text-orange-600 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Auto-Draft Notification */}
          {autoDraftNotice && (
            <div className="p-2.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-900 text-xs flex items-center gap-2 animate-in fade-in">
              <Sparkles className="w-4 h-4 text-orange-600 shrink-0" />
              <span>{autoDraftNotice}</span>
            </div>
          )}

          {/* 3. Review Headline */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-stone-800">
                Review Headline <span className="text-orange-600">*</span>
              </label>
              <button
                type="button"
                onClick={handleAutoDraftReview}
                className="text-[10px] text-orange-600 hover:underline font-semibold flex items-center gap-0.5"
              >
                <Sparkles className="w-2.5 h-2.5" />
                <span>Auto-Suggest</span>
              </button>
            </div>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Outstanding Mt. Elgon pour-over in a peaceful courtyard"
              className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-2xs"
            />
          </div>

          {/* 4. Review Body */}
          <div>
            <label className="block text-xs font-semibold text-stone-800 mb-1">
              Detailed Experience <span className="text-orange-600">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Describe the craft quality, barista recommendations, garden seating, or favorite items..."
              className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-2xs resize-none"
            />
          </div>

          {/* 5. Visit Date & Patron Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="p-2.5 rounded-xl bg-stone-100 text-stone-600 text-[11px] flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-stone-500" />
                <span className="font-semibold">When visited:</span>
              </div>
              <select
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="bg-white border border-stone-300 rounded px-1.5 py-0.5 text-[10px] font-medium text-stone-800 focus:outline-none"
              >
                <option value="This week">This week</option>
                <option value="Last weekend">Last weekend</option>
                <option value="September 2026">September 2026</option>
                <option value="Within past 3 months">Past 3 months</option>
              </select>
            </div>

            <div className="p-2.5 rounded-xl bg-stone-100 text-stone-500 text-[11px] flex items-center gap-2">
              <span className="font-bold text-stone-700">Posting as:</span>
              <span className="text-stone-800 font-semibold truncate">
                {currentUser?.business_name || 'Community Patron'}
              </span>
              <span className="ml-auto px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] shrink-0">
                Verified Patron
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-between gap-2 border-t border-stone-100">
            <button
              type="button"
              onClick={handleAutoDraftReview}
              className="text-stone-500 hover:text-orange-600 text-[11px] font-semibold flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-orange-600" />
              <span>Auto-Suggest Draft</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={closeWriteReviewModal}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !title.trim() || !comment.trim()}
                className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition active:scale-95 flex items-center gap-1.5"
              >
                <Star className="w-3.5 h-3.5 fill-white" />
                <span>{isSubmitting ? 'Publishing...' : 'Publish Review'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
