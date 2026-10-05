import React, { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
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
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db } from '../../lib/mockEngine';
import { MediaType } from '../../types';
import { BusinessQRCodeModal } from '../modals/BusinessQRCodeModal';

export const BusinessInsightsDashboard: React.FC = () => {
  const {
    currentUser,
    setActiveTab,
    openCreateModal,
    switchAccount,
    showToast,
  } = useApp();

  const allProfiles = useMemo(() => db.getAllProfiles(), []);

  // Selected business to inspect (defaults to logged-in user or first artisan)
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>(
    currentUser?.id || 'user_coffee'
  );
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('7d');
  const [activeMetricFilter, setActiveMetricFilter] = useState<'all' | 'views' | 'likes' | 'comments'>('all');
  const [tableSort, setTableSort] = useState<'views' | 'likes' | 'comments' | 'engagement' | 'date'>('views');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isQrModalOpen, setQrModalOpen] = useState(false);

  // Load insights data from engine
  const insights = useMemo(() => {
    return db.getBusinessInsights(selectedBusinessId, timeRange);
  }, [selectedBusinessId, timeRange, isRefreshing]);

  const { business, summary, dailyTimeline, postPerformance, mediaBreakdown, hourlyDistribution, growthRecommendations } = insights;
  const isOwner = currentUser?.id === business.id;

  const handleRefresh = () => {
    setIsRefreshing(true);
    db.recomputeTrendingScores();
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('Engagement analytics refreshed.', 'success');
    }, 400);
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
      case 'date':
        return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case 'views':
      default:
        return list.sort((a, b) => b.views - a.views);
    }
  }, [postPerformance, tableSort]);

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
                <span>Business Insights</span>
              </h1>
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-200">
                Analytics
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Live engagement metrics, post reach, and audience interaction trends
            </p>
          </div>
        </div>

        {/* Action Controls: Business Switcher & Time Range */}
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

          {/* Time Range Segmented Control */}
          <div className="flex items-center bg-stone-100 p-0.5 rounded-xl border border-stone-200/80">
            <button
              onClick={() => setTimeRange('7d')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                timeRange === '7d'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              7D
            </button>
            <button
              onClick={() => setTimeRange('30d')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                timeRange === '30d'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              30D
            </button>
            <button
              onClick={() => setTimeRange('all')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                timeRange === 'all'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              All Time
            </button>
          </div>

          {/* Refresh Button */}
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
      <div className="bg-gradient-to-r from-stone-900 to-stone-800 text-white rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
            <span>Market QR Stand</span>
          </button>
          {isOwner && (
            <button
              onClick={openCreateModal}
              className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-sm transition active:scale-95 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Showcase New Craft</span>
            </button>
          )}
          <button
            onClick={() => setActiveTab('profile')}
            className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold border border-stone-700 transition"
          >
            View Profile
          </button>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Card 1: Total Views */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-2xs hover:border-orange-300 transition">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium">Total Views</span>
            <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <Eye className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl font-black text-stone-900 tabular-nums">
              {summary.totalViews.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-stone-500">
            <span className="text-emerald-600 font-semibold flex items-center">
              <ArrowUpRight className="w-3 h-3" />
              +{summary.viewsVelocity24h}
            </span>
            <span>last 24h</span>
          </div>
        </div>

        {/* Card 2: Total Likes */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-2xs hover:border-rose-300 transition">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium">Showcase Likes</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Heart className="w-3.5 h-3.5 fill-rose-500" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl font-black text-stone-900 tabular-nums">
              {summary.totalLikes.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-stone-500">
            <span className="font-mono text-stone-700 font-semibold">{summary.likesRatio}%</span>
            <span>viewer like rate</span>
          </div>
        </div>

        {/* Card 3: Total Comments */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-2xs hover:border-amber-300 transition">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium">Comments & Inquiries</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <MessageCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl font-black text-stone-900 tabular-nums">
              {summary.totalComments.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-stone-500">
            <span className="font-mono text-stone-700 font-semibold">
              {summary.totalPosts > 0 ? (summary.totalComments / summary.totalPosts).toFixed(1) : 0}
            </span>
            <span>avg per post</span>
          </div>
        </div>

        {/* Card 4: Engagement Rate */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-2xs hover:border-emerald-300 transition">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium">Engagement Rate</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl font-black text-stone-900 tabular-nums">
              {summary.overallEngagementRate}%
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-stone-500">
            <span className="font-semibold text-orange-600">{summary.bestPerformingFormat}</span>
            <span>best medium</span>
          </div>
        </div>
      </div>

      {/* Main Chart 1: Daily Engagement Velocity (recharts AreaChart) */}
      <section className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h3 className="font-display text-sm font-bold text-stone-900">
              Engagement Velocity Over Time
            </h3>
            <p className="text-xs text-stone-500">
              Daily trend of views, likes, and comments across your showcases
            </p>
          </div>

          {/* Metric Filter Tabs */}
          <div className="flex items-center bg-stone-100 p-0.5 rounded-xl border border-stone-200/70 text-xs">
            <button
              onClick={() => setActiveMetricFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                activeMetricFilter === 'all'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              All Metrics
            </button>
            <button
              onClick={() => setActiveMetricFilter('views')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition flex items-center gap-1 ${
                activeMetricFilter === 'views'
                  ? 'bg-white text-orange-600 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />
              <span>Views</span>
            </button>
            <button
              onClick={() => setActiveMetricFilter('likes')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition flex items-center gap-1 ${
                activeMetricFilter === 'likes'
                  ? 'bg-white text-rose-600 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
              <span>Likes</span>
            </button>
            <button
              onClick={() => setActiveMetricFilter('comments')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition flex items-center gap-1 ${
                activeMetricFilter === 'comments'
                  ? 'bg-white text-amber-600 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
              <span>Comments</span>
            </button>
          </div>
        </div>

        {/* Recharts Area Chart */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ea580c" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#ea580c" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="likesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e11d48" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#e11d48" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="commentsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d97706" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#d97706" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
              <XAxis
                dataKey="dateLabel"
                stroke="#a8a29e"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#e7e5e4' }}
              />
              <YAxis
                stroke="#a8a29e"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-xl text-xs space-y-1.5 font-sans">
                        <p className="font-bold text-stone-900 border-b border-stone-100 pb-1">{label}</p>
                        {payload.map((entry) => (
                          <div key={entry.name} className="flex items-center justify-between gap-4">
                            <span className="flex items-center gap-1.5 text-stone-600">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: entry.color }}
                              />
                              {entry.name}:
                            </span>
                            <span className="font-mono font-bold text-stone-900">
                              {Number(entry.value).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ fontSize: 12, paddingBottom: 12 }}
              />

              {(activeMetricFilter === 'all' || activeMetricFilter === 'views') && (
                <Area
                  type="monotone"
                  dataKey="views"
                  name="Views"
                  stroke="#ea580c"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#viewsGrad)"
                />
              )}

              {(activeMetricFilter === 'all' || activeMetricFilter === 'likes') && (
                <Area
                  type="monotone"
                  dataKey="likes"
                  name="Likes"
                  stroke="#e11d48"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#likesGrad)"
                />
              )}

              {(activeMetricFilter === 'all' || activeMetricFilter === 'comments') && (
                <Area
                  type="monotone"
                  dataKey="comments"
                  name="Comments"
                  stroke="#d97706"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#commentsGrad)"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Main Chart 2: Post-by-Post Comparison (recharts BarChart) */}
      <section className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="font-display text-sm font-bold text-stone-900">
              Post-by-Post Reach & Reactions
            </h3>
            <p className="text-xs text-stone-500">
              Side-by-side performance of your individual craft showcases
            </p>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-mono text-stone-500">{postPerformance.length} Showcases tracked</span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={postPerformance}
              margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
              <XAxis
                dataKey="shortCaption"
                stroke="#a8a29e"
                tick={{ fontSize: 10 }}
                interval={0}
                angle={-15}
                textAnchor="end"
                tickLine={false}
                axisLine={{ stroke: '#e7e5e4' }}
              />
              <YAxis
                stroke="#a8a29e"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const postData = payload[0].payload as any;
                    return (
                      <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-xl text-xs space-y-2 max-w-xs font-sans">
                        <p className="font-semibold text-stone-900 line-clamp-2">{postData.caption}</p>
                        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-stone-100 text-center font-mono">
                          <div>
                            <span className="text-[10px] text-stone-400 block">Views</span>
                            <span className="font-bold text-stone-900">{postData.views}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-rose-500 block">Likes</span>
                            <span className="font-bold text-rose-600">{postData.likes}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-amber-500 block">Comments</span>
                            <span className="font-bold text-amber-600">{postData.comments}</span>
                          </div>
                        </div>
                        <div className="text-[10px] text-stone-500 flex items-center justify-between">
                          <span>Engagement Rate:</span>
                          <span className="font-bold text-emerald-700">{postData.engagementRate}%</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: 12, paddingBottom: 10 }} />
              <Bar dataKey="views" name="Views" fill="#ea580c" radius={[4, 4, 0, 0]} />
              <Bar dataKey="likes" name="Likes" fill="#e11d48" radius={[4, 4, 0, 0]} />
              <Bar dataKey="comments" name="Comments" fill="#d97706" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Grid: 2 Column Insights (Media Type Breakdown & Hourly Distribution) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sub-Chart 1: Media Format Breakdown (PieChart / Donut) */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-sm font-bold text-stone-900">
                  Performance by Format
                </h3>
                <p className="text-xs text-stone-500">Photos vs Videos vs Audio engagement</p>
              </div>
              <div className="p-1.5 rounded-lg bg-stone-100 text-stone-600">
                <Layers className="w-4 h-4" />
              </div>
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
                    {mediaBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any, item: any) => [
                      `${Number(value).toLocaleString()} views (${item.payload.avgEngagement}% avg engagement)`,
                      name,
                    ]}
                  />
                  <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Format Table Breakdown */}
          <div className="space-y-2 pt-3 border-t border-stone-100">
            {mediaBreakdown.map((mb) => (
              <div key={mb.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {getMediaIcon(mb.type)}
                  <span className="font-medium text-stone-800">{mb.name}</span>
                  <span className="text-[10px] text-stone-400 font-mono">({mb.count} posts)</span>
                </div>
                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span className="text-stone-600">{mb.totalViews} views</span>
                  <span className="font-bold text-emerald-700">{mb.avgEngagement}% conv</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sub-Chart 2: Audience Activity by Time of Day (BarChart) */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-sm font-bold text-stone-900">
                  Peak Community Activity
                </h3>
                <p className="text-xs text-stone-500">When followers engage with your workshop</p>
              </div>
              <div className="p-1.5 rounded-lg bg-orange-50 text-orange-600">
                <Flame className="w-4 h-4" />
              </div>
            </div>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
                  <XAxis
                    dataKey="slot"
                    stroke="#a8a29e"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(val) => {
                      switch (val) {
                        case 'morning': return 'Morning';
                        case 'afternoon': return 'Afternoon';
                        case 'evening': return 'Evening';
                        case 'night': return 'Night';
                        default: return val;
                      }
                    }}
                    tickLine={false}
                    axisLine={{ stroke: '#e7e5e4' }}
                  />
                  <YAxis stroke="#a8a29e" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(value: any, name: any) => [Number(value).toLocaleString(), name]}
                  />
                  <Bar dataKey="views" name="Audience Views" fill="#f97316" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="interactions" name="Reactions" fill="#d97706" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-amber-50/70 border border-amber-200/70 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2 mt-3">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[11px]">Optimal Publishing Window</p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Afternoon (12:00 PM – 5:00 PM) yields 42% of all daily reactions.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Strategic Growth Recommendations */}
      <section className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display text-sm font-bold text-stone-900">
              Artisan Content Insights & Strategy
            </h3>
            <p className="text-xs text-stone-500">
              Data-backed takeaways to boost repeat customer discovery
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          {growthRecommendations.map((rec, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl border border-stone-200/80 bg-stone-50/50 hover:bg-stone-50 transition text-xs flex items-start gap-2.5"
            >
              <div className="w-5 h-5 rounded-full bg-orange-600/10 text-orange-700 font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                {idx + 1}
              </div>
              <p className="text-stone-700 leading-relaxed font-sans">{rec}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Detailed Post Performance Table */}
      <section className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h3 className="font-display text-sm font-bold text-stone-900">
              Showcase Performance Breakdown
            </h3>
            <p className="text-xs text-stone-500">
              Ranked list of all active craft showcases
            </p>
          </div>

          {/* Sort Tabs */}
          <div className="flex items-center bg-stone-100 p-0.5 rounded-xl border border-stone-200/80 text-xs">
            <button
              onClick={() => setTableSort('views')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                tableSort === 'views' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Most Views
            </button>
            <button
              onClick={() => setTableSort('likes')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                tableSort === 'likes' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Most Likes
            </button>
            <button
              onClick={() => setTableSort('comments')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                tableSort === 'comments' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Comments
            </button>
            <button
              onClick={() => setTableSort('engagement')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                tableSort === 'engagement' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Conv %
            </button>
          </div>
        </div>

        {/* Table */}
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
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {sortedPosts.map((post) => (
                <tr key={post.id} className="hover:bg-stone-50/70 transition group">
                  <td className="py-3 pr-3 min-w-[220px]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                        {post.media_type === 'video' ? (
                          <img
                            src={post.thumbnail_url || post.media_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : post.media_type === 'audio' ? (
                          <div className="w-full h-full flex items-center justify-center bg-stone-900 text-orange-400">
                            <Mic className="w-4 h-4" />
                          </div>
                        ) : (
                          <img
                            src={post.media_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-stone-900 line-clamp-1 text-xs">
                          {post.caption}
                        </p>
                        <span className="text-[10px] text-stone-400 font-mono">
                          {new Date(post.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 text-[11px] text-stone-600 font-medium capitalize">
                      {getMediaIcon(post.media_type)}
                      <span>{post.media_type}</span>
                    </span>
                  </td>
                  <td className="py-3 pr-3 text-right font-mono font-bold text-stone-900 whitespace-nowrap">
                    {post.views.toLocaleString()}
                  </td>
                  <td className="py-3 pr-3 text-right font-mono text-rose-600 font-semibold whitespace-nowrap">
                    {post.likes}
                  </td>
                  <td className="py-3 pr-3 text-right font-mono text-amber-600 font-semibold whitespace-nowrap">
                    {post.comments}
                  </td>
                  <td className="py-3 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                    {post.engagementRate}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Market QR Code & Tabletop Stand Modal */}
      <BusinessQRCodeModal
        profile={business}
        isOpen={isQrModalOpen}
        onClose={() => setQrModalOpen(false)}
      />
    </div>
  );
};
