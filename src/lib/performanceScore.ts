import { Post, PostPerformanceBreakdown } from '../types';

/**
 * Calculates a comprehensive 0-100 Performance Score for any post based on:
 * 1. Engagement (45% weight): Likes, comments, shares, and bookmark saves relative to views.
 * 2. Reach (30% weight): Unique accounts reached and viewer breadth.
 * 3. Interaction Time (25% weight): Average dwell time and duration spent engaging with the showcase.
 */
export function calculatePostPerformance(post: Partial<Post>): PostPerformanceBreakdown {
  const views = Math.max(0, post.view_count || 0);
  const likes = Math.max(0, post.like_count ?? post.likes_count ?? 0);
  const comments = Math.max(0, post.comment_count ?? post.comments_count ?? 0);
  const shares = Math.max(0, post.share_count || 0);
  const saves = Math.max(0, post.save_count || 0);

  // If already pre-computed on post and non-zero reach
  const reachCount = post.reach_count || Math.max(likes + comments, Math.round(views * 0.84)) || 1;

  // Derive realistic average interaction / dwell time (in seconds) if not explicitly set
  let avgInteractionTimeSeconds = post.avg_interaction_time_seconds;
  if (!avgInteractionTimeSeconds || avgInteractionTimeSeconds <= 0) {
    const captionLength = (post.caption || '').length;
    const isVideo = post.media_type === 'video';
    const isAudio = post.media_type === 'audio';

    if (isVideo) {
      avgInteractionTimeSeconds = Math.min(
        post.duration || 30,
        Math.max(8, Math.round(14 + (views > 0 ? (likes / views) * 30 : 0) + (comments > 2 ? 6 : 2)))
      );
    } else if (isAudio) {
      avgInteractionTimeSeconds = Math.min(
        post.duration || 60,
        Math.max(12, Math.round(20 + (views > 0 ? (likes / views) * 40 : 0) + (comments > 2 ? 8 : 4)))
      );
    } else {
      // Photo / visual showcase: dwell time driven by caption depth and commentary
      const readSeconds = Math.max(5, Math.round(captionLength / 25));
      avgInteractionTimeSeconds = Math.min(32, Math.max(6, readSeconds + (comments * 1.8)));
    }
  }

  // 1. Engagement Pillar (Weight: 45%)
  // Weighted interactions: comments & shares reflect deep resonance vs simple passive taps
  const totalInteractions = likes + comments * 2.2 + shares * 3.0 + saves * 2.5;
  const rawRate = views > 0 ? (totalInteractions / views) : (totalInteractions > 0 ? 0.2 : 0);
  const engagementRatePercent = views > 0 ? Number(((likes + comments + shares + saves) / views * 100).toFixed(1)) : 0;

  // Scale rawRate (benchmarked around 10-14% being top tier)
  let engagementScore = Math.min(100, Math.round((rawRate / 0.16) * 78 + Math.min(22, totalInteractions * 0.9)));
  if (likes === 0 && comments === 0 && views < 5) {
    engagementScore = Math.min(40, Math.max(10, views * 6));
  }

  // 2. Reach Pillar (Weight: 30%)
  // Measures community penetration and discovery breadth for local artisans (0-600 accounts benchmark)
  let reachScore: number;
  if (reachCount <= 10) {
    reachScore = Math.max(15, reachCount * 3.5);
  } else if (reachCount <= 60) {
    reachScore = 35 + ((reachCount - 10) / 50) * 28; // 35 -> 63
  } else if (reachCount <= 220) {
    reachScore = 63 + ((reachCount - 60) / 160) * 22; // 63 -> 85
  } else {
    reachScore = Math.min(100, 85 + ((reachCount - 220) / 380) * 15); // 85 -> 100
  }
  reachScore = Math.round(Math.max(10, Math.min(100, reachScore)));

  // 3. Interaction Time Pillar (Weight: 25%)
  // Dwell benchmark: 10s is baseline, 20s is strong, 32s+ is stellar retention
  let interactionTimeScore: number;
  if (avgInteractionTimeSeconds <= 6) {
    interactionTimeScore = Math.max(15, avgInteractionTimeSeconds * 6);
  } else if (avgInteractionTimeSeconds <= 16) {
    interactionTimeScore = 36 + ((avgInteractionTimeSeconds - 6) / 10) * 32; // 36 -> 68
  } else if (avgInteractionTimeSeconds <= 28) {
    interactionTimeScore = 68 + ((avgInteractionTimeSeconds - 16) / 12) * 22; // 68 -> 90
  } else {
    interactionTimeScore = Math.min(100, 90 + ((avgInteractionTimeSeconds - 28) / 20) * 10);
  }
  interactionTimeScore = Math.round(Math.max(10, Math.min(100, interactionTimeScore)));

  // Overall Composite Score (0 - 100)
  const composite = Math.round(
    engagementScore * 0.45 + reachScore * 0.30 + interactionTimeScore * 0.25
  );
  const score = Math.max(5, Math.min(99, composite));

  // Determine resonance tier
  let tier: 'viral' | 'high' | 'solid' | 'growing';
  let tierLabel: string;

  if (score >= 85) {
    tier = 'viral';
    tierLabel = 'Viral Resonance';
  } else if (score >= 70) {
    tier = 'high';
    tierLabel = 'High Impact';
  } else if (score >= 50) {
    tier = 'solid';
    tierLabel = 'Solid Engagement';
  } else {
    tier = 'growing';
    tierLabel = 'Building Reach';
  }

  // Generate contextual strength & craft recommendation
  let keyStrength = '';
  let recommendation = '';

  if (comments >= 5 || saves >= 8) {
    keyStrength = `High discussion volume (${comments} inquiries) and ${saves} bookmark saves signal strong commercial intent.`;
    recommendation = 'Prompt conversation by asking patrons their preferred customized size or roasted flavor profile in the caption.';
  } else if (reachCount >= 200 || views >= 250) {
    keyStrength = `Wide community reach with ${reachCount} unique artisan accounts seeing this craft piece.`;
    recommendation = 'Add direct purchase instructions or workshop opening hours so new viewers convert into direct inquiries.';
  } else if (avgInteractionTimeSeconds >= 20) {
    keyStrength = `Exceptional attention retention (${avgInteractionTimeSeconds}s dwell duration); viewers thoroughly absorbed your craft narrative.`;
    recommendation = 'Behind-the-scenes workbench stories keep audience hooked. Continue sharing raw process footage and maker thoughts.';
  } else {
    keyStrength = `Consistent artisan baseline with active local reactions and steady discovery momentum.`;
    recommendation = 'Pair this showcase with trending district tags (#Crafts, #SpecialtyRoast) and cross-post during afternoon peak hours.';
  }

  return {
    score,
    tier,
    tierLabel,
    engagementScore,
    reachScore,
    interactionTimeScore,
    reachCount,
    viewCount: views,
    totalInteractions: likes + comments + shares + saves,
    engagementRatePercent,
    avgInteractionTimeSeconds: Math.round(avgInteractionTimeSeconds),
    keyStrength,
    recommendation,
  };
}

/**
 * Returns visual styling tokens for a given score tier
 */
export function getPerformanceBadgeClasses(tier: 'viral' | 'high' | 'solid' | 'growing'): {
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  dotColor: string;
  meterGradient: string;
} {
  switch (tier) {
    case 'viral':
      return {
        badgeBg: 'bg-purple-50 hover:bg-purple-100/90 text-purple-900',
        badgeBorder: 'border-purple-200/90',
        badgeText: 'text-purple-700',
        dotColor: 'bg-purple-600',
        meterGradient: 'from-purple-500 to-indigo-600',
      };
    case 'high':
      return {
        badgeBg: 'bg-emerald-50 hover:bg-emerald-100/90 text-emerald-950',
        badgeBorder: 'border-emerald-200/90',
        badgeText: 'text-emerald-700',
        dotColor: 'bg-emerald-600',
        meterGradient: 'from-emerald-500 to-teal-600',
      };
    case 'solid':
      return {
        badgeBg: 'bg-amber-50 hover:bg-amber-100/90 text-amber-950',
        badgeBorder: 'border-amber-200/90',
        badgeText: 'text-amber-700',
        dotColor: 'bg-amber-600',
        meterGradient: 'from-amber-500 to-orange-600',
      };
    case 'growing':
    default:
      return {
        badgeBg: 'bg-stone-100 hover:bg-stone-200/80 text-stone-800',
        badgeBorder: 'border-stone-200',
        badgeText: 'text-stone-600',
        dotColor: 'bg-stone-400',
        meterGradient: 'from-stone-400 to-stone-600',
      };
  }
}
