import React, { useState, useMemo, useEffect } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Eye,
  Heart,
  MessageCircle,
  TrendingUp,
  Share2,
  Bookmark,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Video,
  Image as ImageIcon,
  Mic,
  ChevronDown,
  Building2,
  RotateCw,
  Plus,
  ArrowLeft,
  Flame,
  Award,
  Layers,
  QrCode,
  Download,
  Target,
  Bell,
  MapPin,
  Clock,
  Compass,
  CheckCircle2,
  Sliders,
  ChevronUp,
  GripVertical,
  Lightbulb,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db } from '../../lib/mockEngine';
import { MediaType, Profile } from '../../types';
import { BusinessQRCodeModal } from '../modals/BusinessQRCodeModal';
import { PerformanceScoreBadge } from '../common/PerformanceScoreBadge';
import { calculatePostPerformance } from '../../lib/performanceScore';

type WidgetId =
  | 'overview'
  | 'goals'
  | 'timeline'
  | 'competitor'
  | 'demographics'
  | 'benchmark'
  | 'ai_ideas'
  | 'formats_and_hours'
  | 'recommendations'
  | 'table';

const DEFAULT_WIDGET_ORDER: WidgetId[] = [
  'overview',
  'goals',
  'timeline',
  'competitor',
  'demographics',
  'benchmark',
  'ai_ideas',
  'formats_and_hours',
  'recommendations',
  'table',
];

export const BusinessInsightsDashboard: React.FC = () => {
  const {
    currentUser,
    setActiveTab,
    openCreateModal,
    showToast,
  } = useApp();

  const allProfiles = useMemo(() => db.getAllProfiles(), []);

  // Selected business to inspect
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>(
    currentUser?.id || 'user_coffee'
  );
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('7d');
  const [activeMetricFilter, setActiveMetricFilter] = useState<'all' | 'views' | 'likes' | 'comments'>('all');
  const [tableSort, setTableSort] = useState<'views' | 'likes' | 'comments' | 'engagement' | 'score' | 'date'>('views');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isQrModalOpen, setQrModalOpen] = useState(false);

  // Widget ordering state
  const [widgetOrder, setWidgetOrder] = useState<WidgetId[]>(() => {
    try {
      const raw = localStorage.getItem('amapati_dashboard_widget_order_v1');
      return raw ? JSON.parse(raw) : DEFAULT_WIDGET_ORDER;
    } catch {
      return DEFAULT_WIDGET_ORDER;
    }
  });

  const saveWidgetOrder = (order: WidgetId[]) => {
    setWidgetOrder(order);
    try {
      localStorage.setItem('amapati_dashboard_widget_order_v1', JSON.stringify(order));
    } catch {}
  };

  const moveWidget = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...widgetOrder];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newOrder.length) return;
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIdx];
    newOrder[targetIdx] = temp;
    saveWidgetOrder(newOrder);
  };

  // Drag and Drop Widget Reordering
  const [draggedWidgetIndex, setDraggedWidgetIndex] = useState<number | null>(null);
  const [dragOverWidgetIndex, setDragOverWidgetIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedWidgetIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `${index}`);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverWidgetIndex !== index) {
      setDragOverWidgetIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverWidgetIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedWidgetIndex === null || draggedWidgetIndex === dropIndex) {
      setDraggedWidgetIndex(null);
      setDragOverWidgetIndex(null);
      return;
    }
    const newOrder = [...widgetOrder];
    const [draggedItem] = newOrder.splice(draggedWidgetIndex, 1);
    newOrder.splice(dropIndex, 0, draggedItem);
    saveWidgetOrder(newOrder);
    setDraggedWidgetIndex(null);
    setDragOverWidgetIndex(null);
    showToast('Dashboard widgets rearranged!', 'success');
  };

  const handleDragEnd = () => {
    setDraggedWidgetIndex(null);
    setDragOverWidgetIndex(null);
  };

  // Monthly Engagement Goals
  const [likesGoal, setLikesGoal] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`amapati_goal_likes_${selectedBusinessId}`);
      return saved ? parseInt(saved, 10) : 150;
    } catch {
      return 150;
    }
  });

  const [commentsGoal, setCommentsGoal] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`amapati_goal_comments_${selectedBusinessId}`);
      return saved ? parseInt(saved, 10) : 40;
    } catch {
      return 40;
    }
  });

  const [isEditingGoals, setIsEditingGoals] = useState(false);

  // Competitor to compare with
  const competitorCandidates = useMemo(() => {
    return allProfiles.filter((p) => p.id !== selectedBusinessId);
  }, [allProfiles, selectedBusinessId]);

  const [selectedCompetitorId, setSelectedCompetitorId] = useState<string>(
    competitorCandidates[0]?.id || 'user_pottery'
  );

  // Load primary insights data
  const insights = useMemo(() => {
    return db.getBusinessInsights(selectedBusinessId, timeRange);
  }, [selectedBusinessId, timeRange, isRefreshing]);

  // Load competitor insights data
  const competitorInsights = useMemo(() => {
    return db.getBusinessInsights(selectedCompetitorId, timeRange);
  }, [selectedCompetitorId, timeRange, isRefreshing]);

  const { business, summary, dailyTimeline, postPerformance, mediaBreakdown, hourlyDistribution, growthRecommendations } = insights;
  const isOwner = currentUser?.id === business.id;

  // 1. High Engagement Spike Detection & Alert on Mount
  useEffect(() => {
    const spikePost = postPerformance.find((p) => p.likes >= 15 || p.engagementRate >= 8.0);
    if (spikePost) {
      const timer = setTimeout(() => {
        showToast(
          `🔥 High-Engagement Spike Alert! Your showcase "${spikePost.caption.slice(0, 30)}..." generated ${spikePost.likes} likes and ${spikePost.views} views!`,
          'success'
        );
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [postPerformance, showToast]);

  // 2. Goal notification alert when approaching or exceeding
  useEffect(() => {
    const likesProgress = Math.round((summary.totalLikes / likesGoal) * 100);
    if (likesProgress >= 100) {
      const timer = setTimeout(() => {
        showToast(
          `🎯 Goal Exceeded! You achieved ${summary.totalLikes}/${likesGoal} likes this month! (${likesProgress}%)`,
          'success'
        );
      }, 1500);
      return () => clearTimeout(timer);
    } else if (likesProgress >= 80) {
      const timer = setTimeout(() => {
        showToast(
          `🚀 Approaching Monthly Goal! You are at ${likesProgress}% (${summary.totalLikes}/${likesGoal}) of your likes target.`,
          'info'
        );
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [summary.totalLikes, likesGoal, showToast]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    db.recomputeTrendingScores();
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('Engagement analytics refreshed.', 'success');
    }, 400);
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'Showcase ID',
      'Caption',
      'Format',
      'Created Date',
      'Views',
      'Likes',
      'Comments',
      'Engagement Rate %',
    ];

    const rows = postPerformance.map((p) => [
      p.id,
      `"${p.caption.replace(/"/g, '""')}"`,
      p.media_type,
      new Date(p.created_at).toISOString().split('T')[0],
      p.views,
      p.likes,
      p.comments,
      p.engagementRate,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `amapati_insights_${business.business_name.replace(/\s+/g, '_')}_${timeRange}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Engagement data exported as CSV file!', 'success');
  };

  // Sort post performance table
  const sortedPosts = useMemo(() => {
    const list = [...postPerformance];
    switch (tableSort) {
      case 'likes':
        return list.sort((a, b) => b.likes - a.likes);
      case 'comments':
        return list.sort((a, b) => b.comments - a.comments);
      case 'engagement':
        return list.sort((a, b) => b.engagementRate - a.engagementRate);
      case 'score':
        return list.sort((a, b) => {
          const scoreA = calculatePostPerformance({
            like_count: a.likes,
            comment_count: a.comments,
            view_count: a.views,
            share_count: a.shares,
            save_count: a.saves,
          }).score;
          const scoreB = calculatePostPerformance({
            like_count: b.likes,
            comment_count: b.comments,
            view_count: b.views,
            share_count: b.shares,
            save_count: b.saves,
          }).score;
          return scoreB - scoreA;
        });
      case 'date':
        return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case 'views':
      default:
        return list.sort((a, b) => b.views - a.views);
    }
  }, [postPerformance, tableSort]);

  // Combined Competitor Timeline comparison
  const competitorComparisonTimeline = useMemo(() => {
    return dailyTimeline.map((item, idx) => {
      const compItem = competitorInsights.dailyTimeline[idx] || { views: 0, likes: 0, comments: 0, dateLabel: item.dateLabel };
      return {
        date: item.date,
        dateLabel: item.dateLabel || item.date,
        yourViews: item.views,
        yourLikes: item.likes,
        competitorViews: compItem.views,
        competitorLikes: compItem.likes,
      };
    });
  }, [dailyTimeline, competitorInsights.dailyTimeline]);

  // AI Content Ideas tailored to the category
  const aiContentIdeas = useMemo(() => {
    const cat = business.category.toLowerCase();
    if (cat.includes('coffee')) {
      return [
        {
          title: 'The 12-Minute Roasting Curve',
          type: 'Video (60s)',
          why: 'Behind-the-scenes roasting generates 4.2x more comments from local coffee enthusiasts.',
          draftCaption: 'From green bean to first crack in Kololo: watch our 12-minute medium roast profile in action.',
        },
        {
          title: 'Mandazi & Pour-Over Pairing',
          type: 'Photo & Story',
          why: 'Local food pairing showcases have an 8.6% engagement conversion in Kampala.',
          draftCaption: 'Our secret morning pairing: fresh spiced cardamom mandazi with Mt. Elgon Washed Arabica.',
        },
        {
          title: 'Cupping Notes: Stone Fruit vs Chocolate',
          type: 'Poll & Video',
          why: 'Interactive sensory polls increase view time by 65%.',
          draftCaption: 'Which note do you taste first in our Bugisu roast? Stone fruit or dark cocoa?',
        },
      ];
    } else if (cat.includes('pottery') || cat.includes('craft')) {
      return [
        {
          title: 'Trimming Raw Clay Live',
          type: 'Video (60s)',
          why: 'Process ASMR and trimming reels drive 70% of custom orders.',
          draftCaption: 'Centering local Mukono terracotta clay on the wheel. Trimming the foot ring for tonight’s batch.',
        },
        {
          title: 'Glaze Firing Reveal',
          type: 'Photo Showcase',
          why: 'Kiln opening posts receive the highest save-to-view ratios.',
          draftCaption: 'Opening the kiln after 24 hours at 1,220°C. That turquoise drip finish came out perfect.',
        },
        {
          title: 'Custom Coffee Mug Commission',
          type: 'Customer Story',
          why: 'Showing bespoke items prompts direct chat inquiries to purchase.',
          draftCaption: 'Custom batch of 12 speckled cappuccino cups crafted for a fellow artisan roaster in Bugolobi.',
        },
      ];
    } else {
      return [
        {
          title: 'Behind the Artisan Workshop',
          type: 'Video (60s)',
          why: 'Makers who show their daily work routine see 3x higher profile follows.',
          draftCaption: 'A day in our workshop: hand-selecting materials and preparing our weekend market batch.',
        },
        {
          title: 'Fresh Batch Availability Announcement',
          type: 'Photo Showcase',
          why: 'Scarcity and fresh drops drive immediate customer DMs.',
          draftCaption: 'Just finished our latest limited production run. Drop by or inbox us directly for custom holds.',
        },
        {
          title: 'Patron Showcase & Community Feedback',
          type: 'Story & Review',
          why: 'Social proof drives 5.1x higher trust among Kampala neighborhood buyers.',
          draftCaption: 'Hearing from our patrons keeps our craft alive! Thank you for supporting authentic local makers.',
        },
      ];
    }
  }, [business.category]);

  const getMediaIcon = (type: MediaType) => {
    switch (type) {
      case 'video':
        return <Video className="w-3.5 h-3.5 text-red-500" />;
      case 'audio':
        return <Mic className="w-3.5 h-3.5 text-purple-500" />;
      case 'image':
      default:
        return <ImageIcon className="w-3.5 h-3.5 text-orange-500" />;
    }
  };

  const likesProgress = Math.min(100, Math.round((summary.totalLikes / likesGoal) * 100));
  const commentsProgress = Math.min(100, Math.round((summary.totalComments / commentsGoal) * 100));

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4 py-6 pb-28 space-y-6">
      {/* Top Bar Navigation & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white rounded-2xl border border-stone-200/90 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('home')}
            className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 transition"
            title="Return to feed"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-lg font-bold text-stone-900 tracking-tight flex items-center gap-1.5">
                <span>Business Insights & Analytics</span>
              </h1>
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-200">
                Pro
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Live engagement metrics, goals, audience demographics, and competitor benchmarks
            </p>
          </div>
        </div>

        {/* Action Controls: Business Switcher, Time Range, CSV Export */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Business Selector */}
          <div className="relative">
            <select
              value={selectedBusinessId}
              onChange={(e) => setSelectedBusinessId(e.target.value)}
              className="appearance-none pl-8 pr-7 py-1.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            >
              {allProfiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.business_name} {currentUser?.id === p.id ? '(You)' : ''}
                </option>
              ))}
            </select>
            <Building2 className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Time Range */}
          <div className="flex items-center bg-stone-100 p-0.5 rounded-xl border border-stone-200/80">
            {(['7d', '30d', 'all'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                  timeRange === r ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {r === '7d' ? '7D' : r === '30d' ? '30D' : 'All Time'}
              </button>
            ))}
          </div>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-700 text-xs font-semibold transition active:scale-95 flex items-center gap-1"
            title="Export engagement data as CSV"
          >
            <Download className="w-3.5 h-3.5 text-stone-600" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 transition disabled:opacity-50"
            title="Refresh analytics data"
          >
            <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-orange-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Business Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <img
            src={business.avatar_url || '/src/assets/images/coffee_roaster_1790587302699.jpg'}
            alt={business.business_name}
            className="w-13 h-13 rounded-2xl object-cover border-2 border-stone-700 shadow-sm shrink-0"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-base font-bold text-white tracking-tight">
                {business.business_name}
              </h2>
              {business.is_verified && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30">
                  Verified Artisan
                </span>
              )}
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              {business.category} · {business.location || 'Local Workshop'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setQrModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold border border-stone-700 transition flex items-center gap-1.5 active:scale-95"
            title="Generate printable market stand QR sign"
          >
            <QrCode className="w-3.5 h-3.5 text-orange-400" />
            <span>Market QR</span>
          </button>
          {isOwner && (
            <button
              onClick={openCreateModal}
              className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-sm transition active:scale-95 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>New Showcase</span>
            </button>
          )}
        </div>
      </div>

      {/* Render Dynamic Order of Widgets */}
      <div className="space-y-6">
        {widgetOrder.map((widgetId, index) => {
          const isFirst = index === 0;
          const isLast = index === widgetOrder.length - 1;

          const renderWidgetControls = (title: string) => (
            <div className="flex items-center gap-1.5 text-stone-400">
              <span
                className="cursor-grab active:cursor-grabbing p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded transition flex items-center gap-1 text-[11px]"
                title="Drag to rearrange widget"
              >
                <GripVertical className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[10px] font-medium text-stone-400">Drag</span>
              </span>
              <div className="flex items-center">
                <button
                  onClick={() => moveWidget(index, 'up')}
                  disabled={isFirst}
                  className="p-1 hover:text-stone-700 disabled:opacity-30 rounded hover:bg-stone-100"
                  title="Move section up"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => moveWidget(index, 'down')}
                  disabled={isLast}
                  className="p-1 hover:text-stone-700 disabled:opacity-30 rounded hover:bg-stone-100"
                  title="Move section down"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );

          const widgetContent = (() => {
            switch (widgetId) {
            case 'overview':
              return (
                <section key={widgetId} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                      Executive Overview
                    </span>
                    {renderWidgetControls('Overview')}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-2xs">
                      <div className="flex items-center justify-between text-stone-400 mb-2">
                        <span className="text-xs font-medium">Total Views</span>
                        <Eye className="w-4 h-4 text-orange-600" />
                      </div>
                      <p className="font-mono text-xl sm:text-2xl font-bold text-stone-900">
                        {summary.totalViews.toLocaleString()}
                      </p>
                      <span className="text-[10px] text-emerald-600 font-semibold mt-1 inline-block">
                        ↑ +{summary.reachGrowth}% vs last period
                      </span>
                    </div>

                    <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-2xs">
                      <div className="flex items-center justify-between text-stone-400 mb-2">
                        <span className="text-xs font-medium">Post Likes</span>
                        <Heart className="w-4 h-4 text-rose-600" />
                      </div>
                      <p className="font-mono text-xl sm:text-2xl font-bold text-stone-900">
                        {summary.totalLikes.toLocaleString()}
                      </p>
                      <span className="text-[10px] text-stone-400 block mt-1">
                        Active community reactions
                      </span>
                    </div>

                    <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-2xs">
                      <div className="flex items-center justify-between text-stone-400 mb-2">
                        <span className="text-xs font-medium">Comments</span>
                        <MessageCircle className="w-4 h-4 text-amber-600" />
                      </div>
                      <p className="font-mono text-xl sm:text-2xl font-bold text-stone-900">
                        {summary.totalComments.toLocaleString()}
                      </p>
                      <span className="text-[10px] text-stone-400 block mt-1">
                        Inquiries & dialogue
                      </span>
                    </div>

                    <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-2xs">
                      <div className="flex items-center justify-between text-stone-400 mb-2">
                        <span className="text-xs font-medium">Engagement Rate</span>
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                      </div>
                      <p className="font-mono text-xl sm:text-2xl font-bold text-emerald-700">
                        {summary.overallEngagementRate}%
                      </p>
                      <span className="text-[10px] text-emerald-700 font-semibold block mt-1">
                        Top tier conversion
                      </span>
                    </div>
                  </div>
                </section>
              );

            case 'goals':
              return (
                <section key={widgetId} className="bg-white rounded-3xl border border-stone-200/90 p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-orange-100/70 text-orange-700">
                        <Target className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-stone-900">Monthly Engagement Goals</h3>
                        <p className="text-xs text-stone-500">Track progress against your monthly community targets</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsEditingGoals(!isEditingGoals)}
                        className="text-xs font-semibold text-orange-600 hover:underline"
                      >
                        {isEditingGoals ? 'Done' : 'Set Targets'}
                      </button>
                      {renderWidgetControls('Goals')}
                    </div>
                  </div>

                  {isEditingGoals && (
                    <div className="grid grid-cols-2 gap-3 p-3 bg-stone-50 rounded-2xl border border-stone-200 text-xs animate-in fade-in">
                      <div>
                        <label className="text-[11px] font-semibold text-stone-700 block mb-1">
                          Monthly Likes Target
                        </label>
                        <input
                          type="number"
                          value={likesGoal}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 50;
                            setLikesGoal(val);
                            localStorage.setItem(`amapati_goal_likes_${selectedBusinessId}`, val.toString());
                          }}
                          className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-stone-700 block mb-1">
                          Monthly Comments Target
                        </label>
                        <input
                          type="number"
                          value={commentsGoal}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 10;
                            setCommentsGoal(val);
                            localStorage.setItem(`amapati_goal_comments_${selectedBusinessId}`, val.toString());
                          }}
                          className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-xl"
                        />
                      </div>
                    </div>
                  )}

                  {/* Progress Bars */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1 font-semibold">
                        <span className="flex items-center gap-1 text-stone-700">
                          <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                          <span>Likes Progress ({summary.totalLikes} / {likesGoal})</span>
                        </span>
                        <span className="font-mono text-rose-600">{likesProgress}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-rose-500 rounded-full transition-all duration-500"
                          style={{ width: `${likesProgress}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs mb-1 font-semibold">
                        <span className="flex items-center gap-1 text-stone-700">
                          <MessageCircle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Comments Progress ({summary.totalComments} / {commentsGoal})</span>
                        </span>
                        <span className="font-mono text-amber-700">{commentsProgress}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all duration-500"
                          style={{ width: `${commentsProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </section>
              );

            case 'timeline':
              return (
                <section key={widgetId} className="bg-white rounded-3xl border border-stone-200/90 p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-sm text-stone-900">Reach & Interaction Trends</h3>
                      <p className="text-xs text-stone-500">Daily audience activity across all showcases</p>
                    </div>
                    {renderWidgetControls('Timeline')}
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dailyTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ea580c" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#ea580c" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="likesGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#e11d48" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#e11d48" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" vertical={false} />
                        <XAxis dataKey="shortDate" stroke="#a8a29e" tick={{ fontSize: 10 }} tickLine={false} />
                        <YAxis stroke="#a8a29e" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: 11 }} />
                        <Area type="monotone" dataKey="views" name="Audience Views" stroke="#ea580c" strokeWidth={2} fillOpacity={1} fill="url(#viewsGrad)" />
                        <Area type="monotone" dataKey="likes" name="Likes" stroke="#e11d48" strokeWidth={2} fillOpacity={1} fill="url(#likesGrad)" />
                        <Area type="monotone" dataKey="comments" name="Comments" stroke="#d97706" strokeWidth={2} fillOpacity={0} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </section>
              );

            case 'competitor':
              return (
                <section key={widgetId} className="bg-white rounded-3xl border border-stone-200/90 p-5 shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-stone-900">Competitor Insights & Benchmark</h3>
                        <p className="text-xs text-stone-500">Compare your audience reach against peer businesses</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={selectedCompetitorId}
                        onChange={(e) => setSelectedCompetitorId(e.target.value)}
                        className="text-xs font-semibold px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-xl"
                      >
                        {competitorCandidates.map((c) => (
                          <option key={c.id} value={c.id}>
                            Compare with {c.business_name} ({c.category})
                          </option>
                        ))}
                      </select>
                      {renderWidgetControls('Competitor')}
                    </div>
                  </div>

                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={competitorComparisonTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" vertical={false} />
                        <XAxis dataKey="shortDate" stroke="#a8a29e" tick={{ fontSize: 10 }} tickLine={false} />
                        <YAxis stroke="#a8a29e" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: 11 }} />
                        <Line
                          type="monotone"
                          dataKey="yourViews"
                          name={`${business.business_name} (You)`}
                          stroke="#ea580c"
                          strokeWidth={2.5}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="competitorViews"
                          name={`${competitorInsights.business.business_name}`}
                          stroke="#3b82f6"
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </section>
              );

            case 'demographics':
              return (
                <section key={widgetId} className="bg-white rounded-3xl border border-stone-200/90 p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-stone-900">Audience Demographics & Heatmap</h3>
                        <p className="text-xs text-stone-500">Geographic & time-of-day follower distribution</p>
                      </div>
                    </div>
                    {renderWidgetControls('Demographics')}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Geographic Districts */}
                    <div className="space-y-2 bg-stone-50/80 p-3.5 rounded-2xl border border-stone-200">
                      <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block">
                        Kampala District Distribution
                      </span>
                      {[
                        { district: 'Kololo & Nakasero', share: 38, count: 182 },
                        { district: 'Bugolobi & Mbuya', share: 29, count: 139 },
                        { district: 'Ntinda & Naguru', share: 18, count: 86 },
                        { district: 'Muyenga & Kansanga', share: 10, count: 48 },
                        { district: 'Entebbe & Greater Uganda', share: 5, count: 24 },
                      ].map((item, dIdx) => (
                        <div key={dIdx} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-stone-800">{item.district}</span>
                            <span className="font-mono text-stone-500">{item.share}% ({item.count})</span>
                          </div>
                          <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${item.share}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Time-of-Day Activity Heatmap Grid */}
                    <div className="space-y-2 bg-stone-50/80 p-3.5 rounded-2xl border border-stone-200">
                      <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block">
                        Hourly Activity Heatmap
                      </span>
                      <div className="grid grid-cols-5 gap-1 text-[10px] text-center pt-1 font-mono">
                        <span className="text-stone-400">Day</span>
                        <span className="text-stone-500">Morning</span>
                        <span className="text-stone-500">Midday</span>
                        <span className="text-stone-500">Evening</span>
                        <span className="text-stone-500">Night</span>

                        {['Mon', 'Wed', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                          <React.Fragment key={day}>
                            <span className="font-bold text-stone-600 text-left">{day}</span>
                            <span className="p-1 rounded bg-orange-100 text-orange-800 font-semibold">22%</span>
                            <span className="p-1 rounded bg-orange-200 text-orange-900 font-semibold">48%</span>
                            <span className="p-1 rounded bg-orange-500 text-white font-black">84%</span>
                            <span className="p-1 rounded bg-orange-50 text-orange-700">12%</span>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              );

            case 'benchmark':
              return (
                <section key={widgetId} className="bg-white rounded-3xl border border-stone-200/90 p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
                        <Sliders className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-stone-900">Industry Benchmark ({business.category})</h3>
                        <p className="text-xs text-stone-500">How you stack up against peer artisans in your category</p>
                      </div>
                    </div>
                    {renderWidgetControls('Benchmark')}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
                      <span className="text-[10px] text-stone-400 font-semibold uppercase block">Engagement Rate</span>
                      <p className="font-mono text-base font-bold text-stone-900 mt-1">{summary.overallEngagementRate}%</p>
                      <span className="text-[10px] font-semibold text-emerald-600">Category Avg: 4.8%</span>
                    </div>

                    <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
                      <span className="text-[10px] text-stone-400 font-semibold uppercase block">Views / Follower</span>
                      <p className="font-mono text-base font-bold text-stone-900 mt-1">3.4x</p>
                      <span className="text-[10px] font-semibold text-emerald-600">Category Avg: 2.1x</span>
                    </div>

                    <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
                      <span className="text-[10px] text-stone-400 font-semibold uppercase block">Video Completion</span>
                      <p className="font-mono text-base font-bold text-stone-900 mt-1">68%</p>
                      <span className="text-[10px] font-semibold text-emerald-600">Category Avg: 52%</span>
                    </div>

                    <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
                      <span className="text-[10px] text-stone-400 font-semibold uppercase block">Inquiry Rate</span>
                      <p className="font-mono text-base font-bold text-stone-900 mt-1">5.2%</p>
                      <span className="text-[10px] font-semibold text-emerald-600">Category Avg: 3.4%</span>
                    </div>
                  </div>
                </section>
              );

            case 'ai_ideas':
              return (
                <section key={widgetId} className="bg-white rounded-3xl border border-stone-200/90 p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                        <Lightbulb className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-stone-900">AI Content Ideas & Topic Inspiration</h3>
                        <p className="text-xs text-stone-500">Data-backed topics modeled on top-performing small business showcases</p>
                      </div>
                    </div>
                    {renderWidgetControls('AI Ideas')}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {aiContentIdeas.map((idea, iIdx) => (
                      <div
                        key={iIdx}
                        className="p-3.5 bg-gradient-to-b from-stone-50 to-white rounded-2xl border border-stone-200 hover:border-orange-300 transition flex flex-col justify-between space-y-2 group"
                      >
                        <div>
                          <div className="flex items-center justify-between text-[10px] font-bold text-orange-700 uppercase tracking-wider">
                            <span>{idea.type}</span>
                            <Sparkles className="w-3 h-3 text-orange-500" />
                          </div>
                          <h4 className="text-xs font-bold text-stone-900 mt-1 leading-snug group-hover:text-orange-600">
                            {idea.title}
                          </h4>
                          <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">
                            {idea.why}
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            openCreateModal();
                          }}
                          className="pt-2 text-left text-[11px] font-bold text-orange-600 hover:underline flex items-center gap-1"
                        >
                          <span>Use Idea in New Post</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              );

            case 'formats_and_hours':
              return (
                <div key={widgetId} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-3xl border border-stone-200/90 p-5 shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-bold text-sm text-stone-900">Performance by Format</h3>
                          <p className="text-xs text-stone-500">Photos vs Videos vs Audio engagement</p>
                        </div>
                        {renderWidgetControls('Formats')}
                      </div>

                      <div className="h-52 w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={mediaBreakdown}
                              dataKey="totalViews"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={55}
                              outerRadius={80}
                              paddingAngle={4}
                            >
                              {mediaBreakdown.map((entry, idx) => (
                                <Cell key={`cell-${idx}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 11 }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-stone-200/90 p-5 shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-bold text-sm text-stone-900">Peak Community Activity</h3>
                          <p className="text-xs text-stone-500">When followers engage with your workshop</p>
                        </div>
                        {renderWidgetControls('Activity')}
                      </div>

                      <div className="h-52 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={hourlyDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" vertical={false} />
                            <XAxis dataKey="slot" stroke="#a8a29e" tick={{ fontSize: 10 }} tickLine={false} />
                            <YAxis stroke="#a8a29e" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                            <Tooltip />
                            <Bar dataKey="views" name="Views" fill="#f97316" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="interactions" name="Reactions" fill="#d97706" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              );

            case 'recommendations':
              return (
                <section key={widgetId} className="bg-white rounded-3xl border border-stone-200/90 p-5 shadow-2xs">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-orange-600" />
                      <h3 className="font-bold text-sm text-stone-900">Artisan Content Strategy Takeaways</h3>
                    </div>
                    {renderWidgetControls('Recommendations')}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                    {growthRecommendations.map((rec, rIdx) => (
                      <div key={rIdx} className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-xs flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-orange-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                          {rIdx + 1}
                        </span>
                        <p className="text-stone-700 leading-relaxed">{rec}</p>
                      </div>
                    ))}
                  </div>
                </section>
              );

            case 'table':
              return (
                <section key={widgetId} className="bg-white rounded-3xl border border-stone-200/90 p-5 shadow-2xs overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <div>
                      <h3 className="font-bold text-sm text-stone-900">Showcase Performance Breakdown</h3>
                      <p className="text-xs text-stone-500">Ranked list of all active craft showcases</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleExportCSV}
                        className="px-2.5 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 text-xs font-semibold flex items-center gap-1"
                      >
                        <Download className="w-3 h-3 text-orange-600" />
                        <span>CSV</span>
                      </button>
                      {renderWidgetControls('Table')}
                    </div>
                  </div>

                  <div className="overflow-x-auto -mx-5 px-5">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-stone-200 text-stone-400 text-[11px] font-semibold">
                          <th className="pb-2.5 font-medium">Showcase</th>
                          <th className="pb-2.5 font-medium">Format</th>
                          <th className="pb-2.5 font-medium text-right">Views</th>
                          <th className="pb-2.5 font-medium text-right">Likes</th>
                          <th className="pb-2.5 font-medium text-right">Comments</th>
                          <th className="pb-2.5 font-medium text-right">Rate</th>
                          <th className="pb-2.5 font-medium text-right cursor-pointer hover:text-stone-700" onClick={() => setTableSort('score')} title="Click to sort by Performance Score">
                            Score
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {sortedPosts.map((post) => (
                          <tr key={post.id} className="hover:bg-stone-50/70 transition">
                            <td className="py-3 pr-3 min-w-[220px]">
                              <p className="font-semibold text-stone-900 line-clamp-1">{post.caption}</p>
                              <span className="text-[10px] text-stone-400 font-mono">
                                {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            </td>
                            <td className="py-3 pr-3 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 text-[11px] text-stone-600 font-medium capitalize">
                                {getMediaIcon(post.media_type)}
                                <span>{post.media_type}</span>
                              </span>
                            </td>
                            <td className="py-3 pr-3 text-right font-mono font-bold text-stone-900">
                              {post.views.toLocaleString()}
                            </td>
                            <td className="py-3 pr-3 text-right font-mono text-rose-600 font-semibold">
                              {post.likes}
                            </td>
                            <td className="py-3 pr-3 text-right font-mono text-amber-600 font-semibold">
                              {post.comments}
                            </td>
                            <td className="py-3 pr-3 text-right font-mono font-bold text-emerald-700">
                              {post.engagementRate}%
                            </td>
                            <td className="py-3 text-right whitespace-nowrap">
                              <PerformanceScoreBadge
                                post={{
                                  id: post.id,
                                  caption: post.caption,
                                  like_count: post.likes,
                                  comment_count: post.comments,
                                  view_count: post.views,
                                  share_count: post.shares,
                                  save_count: post.saves,
                                }}
                                variant="mini"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              );

            default:
              return null;
          }
        })();

        if (!widgetContent) return null;

        return (
          <div
            key={widgetId}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`transition-all duration-200 rounded-3xl ${
              draggedWidgetIndex === index ? 'opacity-40 scale-[0.98] border-2 border-dashed border-orange-400' : ''
            } ${
              dragOverWidgetIndex === index && draggedWidgetIndex !== index
                ? 'ring-2 ring-orange-500/70 ring-offset-2'
                : ''
            }`}
          >
            {widgetContent}
          </div>
        );
      })}
      </div>

      {/* Market QR Code & Tabletop Stand Modal */}
      <BusinessQRCodeModal
        profile={business}
        isOpen={isQrModalOpen}
        onClose={() => setQrModalOpen(false)}
      />
    </div>
  );
};
