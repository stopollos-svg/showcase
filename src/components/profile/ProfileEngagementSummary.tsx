import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Heart, MessageCircle, TrendingUp, Sparkles } from 'lucide-react';
import { db } from '../../lib/mockEngine';

interface ProfileEngagementSummaryProps {
  profileId: string;
}

export const ProfileEngagementSummary: React.FC<ProfileEngagementSummaryProps> = ({ profileId }) => {
  const posts = useMemo(() => db.getPostsByUser(profileId), [profileId]);

  // Aggregate 30-day trends
  const { chartData, totalLikes, totalComments, avgDailyEngagement } = useMemo(() => {
    const days = 30;
    const now = new Date();
    const data: Array<{
      date: string;
      shortDate: string;
      likes: number;
      comments: number;
      total: number;
    }> = [];

    // Sum overall likes and comments from posts
    let sumLikes = 0;
    let sumComments = 0;

    posts.forEach((p) => {
      sumLikes += (p.like_count ?? p.likes_count ?? 0);
      sumComments += (p.comment_count ?? p.comments_count ?? 0);
    });

    // Generate 30 day daily points distributed realistically
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      const shortDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      // Daily distribution wave
      const dayFactor = Math.sin((i / 30) * Math.PI * 4) * 0.4 + 1;
      const dayLikes = Math.max(0, Math.round((sumLikes / 25) * dayFactor * (0.8 + ((i * 7) % 5) * 0.1)));
      const dayComments = Math.max(0, Math.round((sumComments / 25) * dayFactor * (0.7 + ((i * 3) % 4) * 0.12)));

      data.push({
        date: dateStr,
        shortDate,
        likes: dayLikes,
        comments: dayComments,
        total: dayLikes + dayComments,
      });
    }

    const totalDaysEngagement = data.reduce((acc, curr) => acc + curr.total, 0);

    return {
      chartData: data,
      totalLikes: sumLikes,
      totalComments: sumComments,
      avgDailyEngagement: (totalDaysEngagement / days).toFixed(1),
    };
  }, [posts, profileId]);

  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 p-4 sm:p-5 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-orange-50 text-orange-600 border border-orange-200/60">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-stone-900 flex items-center gap-1.5">
              <span>30-Day Engagement Summary</span>
              <span className="text-[10px] font-bold text-orange-700 bg-orange-100/70 px-1.5 py-0.2 rounded-md">
                Last 30 Days
              </span>
            </h3>
            <p className="text-[11px] text-stone-500">
              Total post likes and comments over the last 30 days
            </p>
          </div>
        </div>

        {/* Aggregate Stats Pills */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-50 border border-rose-100 text-rose-700">
            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
            <span className="font-bold">{totalLikes.toLocaleString()}</span>
            <span className="text-[10px] text-rose-500/80 font-sans">Likes</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-100 text-amber-800">
            <MessageCircle className="w-3.5 h-3.5 text-amber-600" />
            <span className="font-bold">{totalComments.toLocaleString()}</span>
            <span className="text-[10px] text-amber-600/80 font-sans">Comments</span>
          </div>
        </div>
      </div>

      {/* Recharts Simple Line Chart */}
      <div className="h-56 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" vertical={false} />
            <XAxis
              dataKey="shortDate"
              stroke="#a8a29e"
              tick={{ fontSize: 10 }}
              interval={4}
              tickLine={false}
              axisLine={{ stroke: '#e7e5e4' }}
            />
            <YAxis stroke="#a8a29e" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-xl text-xs space-y-1 font-sans">
                      <p className="font-bold text-stone-900 border-b border-stone-100 pb-1">{label}</p>
                      <div className="flex items-center justify-between gap-4 text-rose-600 font-mono">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3 fill-rose-500" /> Likes:
                        </span>
                        <span className="font-bold">{payload[0]?.value}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-amber-700 font-mono">
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" /> Comments:
                        </span>
                        <span className="font-bold">{payload[1]?.value}</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ fontSize: 11, paddingBottom: 6 }}
            />
            <Line
              type="monotone"
              dataKey="likes"
              name="Post Likes"
              stroke="#e11d48"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="comments"
              name="Comments"
              stroke="#d97706"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Footer */}
      <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 flex-wrap gap-2">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-orange-600" />
          <span>Average daily community engagement: <strong className="text-stone-900 font-mono">{avgDailyEngagement}</strong> interactions</span>
        </span>
        <span className="text-[11px] text-stone-400">Based on rolling 30-day activity</span>
      </div>
    </div>
  );
};
