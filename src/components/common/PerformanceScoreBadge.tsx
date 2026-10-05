import React, { useState } from 'react';
import {
  Zap,
  Gauge,
  Clock,
  Users,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Sparkles,
  X,
  TrendingUp,
  Info,
  CheckCircle2,
  Lightbulb,
} from 'lucide-react';
import { Post } from '../../types';
import {
  calculatePostPerformance,
  getPerformanceBadgeClasses,
} from '../../lib/performanceScore';

interface PerformanceScoreBadgeProps {
  post: Partial<Post>;
  variant?: 'pill' | 'compact' | 'mini' | 'detailed';
  className?: string;
  showModalOnClick?: boolean;
}

export const PerformanceScoreBadge: React.FC<PerformanceScoreBadgeProps> = ({
  post,
  variant = 'pill',
  className = '',
  showModalOnClick = true,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const breakdown = calculatePostPerformance(post);
  const styles = getPerformanceBadgeClasses(breakdown.tier);

  const handleClick = (e: React.MouseEvent) => {
    if (!showModalOnClick) return;
    e.stopPropagation();
    setIsModalOpen(true);
  };

  return (
    <>
      {variant === 'mini' && (
        <button
          type="button"
          onClick={handleClick}
          title={`Performance Score: ${breakdown.score}/100 (${breakdown.tierLabel}) — Click to view breakdown`}
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold border transition shadow-2xs active:scale-95 ${styles.badgeBg} ${styles.badgeBorder} ${className}`}
        >
          <Zap className="w-2.5 h-2.5 fill-current opacity-80" />
          <span>{breakdown.score}</span>
        </button>
      )}

      {variant === 'compact' && (
        <button
          type="button"
          onClick={handleClick}
          title={`Performance Score: ${breakdown.score}/100 (${breakdown.tierLabel}) — Click to view engagement & reach breakdown`}
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold border transition shadow-2xs hover:shadow-xs active:scale-95 ${styles.badgeBg} ${styles.badgeBorder} ${className}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${styles.dotColor} animate-pulse`} />
          <span className="font-mono">{breakdown.score}</span>
          <span className="text-[9px] font-medium opacity-80 uppercase tracking-tight">Resonance</span>
        </button>
      )}

      {variant === 'pill' && (
        <button
          type="button"
          onClick={handleClick}
          title={`Performance Score: ${breakdown.score}/100 (${breakdown.tierLabel}) — Click to view breakdown`}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition active:scale-95 shadow-2xs hover:shadow-xs ${styles.badgeBg} ${styles.badgeBorder} ${className}`}
        >
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3 fill-current opacity-90" />
            <span className="font-mono font-bold">{breakdown.score}</span>
            <span className="text-[10px] font-normal opacity-70">/100</span>
          </div>
          <span className="text-[10px] font-bold border-l border-current/20 pl-1.5">
            {breakdown.tierLabel}
          </span>
        </button>
      )}

      {variant === 'detailed' && (
        <button
          type="button"
          onClick={handleClick}
          className={`flex items-center justify-between w-full p-2.5 rounded-xl border text-left transition hover:shadow-2xs active:scale-99 ${styles.badgeBg} ${styles.badgeBorder} ${className}`}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center shadow-2xs border border-current/15">
              <Zap className="w-4 h-4 text-orange-600 fill-orange-500" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold">Performance Score</span>
                <span className="font-mono text-xs font-bold">{breakdown.score}/100</span>
              </div>
              <p className="text-[10px] text-stone-600 line-clamp-1">{breakdown.keyStrength}</p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90 border border-current/20">
            {breakdown.tierLabel}
          </span>
        </button>
      )}

      {/* Breakdown Modal */}
      {isModalOpen && (
        <PerformanceScoreModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          post={post}
        />
      )}
    </>
  );
};

interface PerformanceScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Partial<Post>;
  authorName?: string;
}

export const PerformanceScoreModal: React.FC<PerformanceScoreModalProps> = ({
  isOpen,
  onClose,
  post,
  authorName,
}) => {
  if (!isOpen) return null;

  const breakdown = calculatePostPerformance(post);
  const styles = getPerformanceBadgeClasses(breakdown.tier);
  const likes = post.like_count ?? post.likes_count ?? 0;
  const comments = post.comment_count ?? post.comments_count ?? 0;
  const shares = post.share_count || 0;
  const saves = post.save_count || 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 text-stone-900 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center">
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-stone-900 leading-tight">
              Post Performance Score
            </h3>
            <p className="text-[11px] text-stone-500">
              Resonance diagnostic for {authorName || post.user?.business_name || 'Showcase'}
            </p>
          </div>
        </div>

        {/* Circular / Hero Metric Card */}
        <div className={`p-4 rounded-2xl border mb-5 ${styles.badgeBg} ${styles.badgeBorder}`}>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">
                Overall Content Resonance
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-4xl font-extrabold tracking-tight">
                  {breakdown.score}
                </span>
                <span className="text-sm font-semibold text-stone-400">/ 100</span>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-white shadow-2xs border border-current/20">
                <span className={`w-2 h-2 rounded-full ${styles.dotColor}`} />
                <span>{breakdown.tierLabel}</span>
              </span>
              <p className="text-[10px] text-stone-500 mt-1">
                {breakdown.score >= 70 ? 'Top 15% in Craft' : 'Steady Discovery'}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2.5 bg-black/10 rounded-full mt-3 overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${styles.meterGradient} transition-all duration-700`}
              style={{ width: `${breakdown.score}%` }}
            />
          </div>
        </div>

        {/* The 3 Core Pillars */}
        <div className="space-y-3 mb-5">
          <h4 className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
            Resonance Pillars Breakdown
          </h4>

          {/* 1. Engagement Pillar */}
          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                <span className="text-xs font-bold text-stone-800">Engagement</span>
                <span className="text-[10px] text-stone-400 font-medium">(45% weight)</span>
              </div>
              <span className="font-mono text-xs font-bold text-stone-900">
                {breakdown.engagementScore}/100
              </span>
            </div>
            <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-rose-500 rounded-full transition-all duration-500"
                style={{ width: `${breakdown.engagementScore}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-stone-600 font-mono">
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3 text-stone-400" /> {likes} likes
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3 text-stone-400" /> {comments} comments
              </span>
              <span className="flex items-center gap-1">
                <Share2 className="w-3 h-3 text-stone-400" /> {shares} shares
              </span>
              <span className="flex items-center gap-1">
                <Bookmark className="w-3 h-3 text-stone-400" /> {saves} saves
              </span>
            </div>
          </div>

          {/* 2. Reach Pillar */}
          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-xs font-bold text-stone-800">Unique Reach</span>
                <span className="text-[10px] text-stone-400 font-medium">(30% weight)</span>
              </div>
              <span className="font-mono text-xs font-bold text-stone-900">
                {breakdown.reachScore}/100
              </span>
            </div>
            <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${breakdown.reachScore}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-stone-600">
              <span>{breakdown.reachCount} unique artisan accounts</span>
              <span className="font-mono text-stone-500">
                {breakdown.viewCount} total views
              </span>
            </div>
          </div>

          {/* 3. Interaction Time Pillar */}
          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs font-bold text-stone-800">Interaction Time</span>
                <span className="text-[10px] text-stone-400 font-medium">(25% weight)</span>
              </div>
              <span className="font-mono text-xs font-bold text-stone-900">
                {breakdown.interactionTimeScore}/100
              </span>
            </div>
            <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${breakdown.interactionTimeScore}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-stone-600">
              <span>Avg Dwell Time</span>
              <span className="font-mono font-bold text-amber-700">
                ~{breakdown.avgInteractionTimeSeconds}s per view
              </span>
            </div>
          </div>
        </div>

        {/* Actionable Insights Box */}
        <div className="p-3.5 rounded-2xl bg-orange-50/70 border border-orange-200/80 mb-4">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
            <div>
              <h5 className="text-xs font-bold text-orange-950">Resonance Takeaway</h5>
              <p className="text-xs text-stone-700 mt-0.5 leading-relaxed">
                {breakdown.keyStrength}
              </p>
              <div className="mt-2 pt-2 border-t border-orange-200/60 flex items-start gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-orange-700 shrink-0 mt-0.5" />
                <p className="text-[11px] text-stone-800 font-medium leading-relaxed">
                  <span className="font-bold text-orange-900">Next Step: </span>
                  {breakdown.recommendation}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Algorithm footnote */}
        <p className="text-[10px] text-stone-400 text-center leading-normal">
          Calculated continuously based on live engagement velocity, verified reach, and audience interaction dwell time.
        </p>
      </div>
    </div>
  );
};
