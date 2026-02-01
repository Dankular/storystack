'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui';

export default function DashboardPage() {
  const router = useRouter();
  const { token, isAuthenticated } = useAuthStore();
  const [selectedStory, setSelectedStory] = useState<string | null>(null);

  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['analytics-dashboard'],
    queryFn: () => api.getAnalyticsDashboard(token!),
    enabled: isAuthenticated && !!token,
  });

  const { data: topStories, isLoading: storiesLoading } = useQuery({
    queryKey: ['top-stories'],
    queryFn: () => api.getTopStories(token!, 10),
    enabled: isAuthenticated && !!token,
  });

  const { data: followerGrowth } = useQuery({
    queryKey: ['follower-growth'],
    queryFn: () => api.getFollowerGrowth(token!, 30),
    enabled: isAuthenticated && !!token,
  });

  const { data: storyAnalytics, isLoading: storyAnalyticsLoading } = useQuery({
    queryKey: ['story-analytics', selectedStory],
    queryFn: () => api.getStoryAnalytics(selectedStory!, token!),
    enabled: isAuthenticated && !!token && !!selectedStory,
  });

  if (!isAuthenticated) {
    if (typeof window !== 'undefined') {
      router.push('/login');
    }
    return null;
  }

  const isLoading = statsLoading || storiesLoading;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Author Dashboard</h1>
          <Link href="/earnings">
            <Button variant="outline">View Earnings</Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-sky-500 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                title="Total Views"
                value={formatNumber(dashboardStats?.totalViews || 0)}
                subtitle={`${formatNumber(dashboardStats?.todayViews || 0)} today`}
                icon="eye"
              />
              <StatCard
                title="Followers"
                value={formatNumber(dashboardStats?.totalFollowers || 0)}
                icon="users"
              />
              <StatCard
                title="Total Likes"
                value={formatNumber(dashboardStats?.totalLikes || 0)}
                icon="heart"
              />
              <StatCard
                title="Reviews"
                value={formatNumber(dashboardStats?.totalReviews || 0)}
                icon="star"
              />
            </div>

            {/* Views Trend */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Views This Week</h3>
                <p className="text-3xl font-bold text-gray-900">
                  {formatNumber(dashboardStats?.weekViews || 0)}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Views This Month</h3>
                <p className="text-3xl font-bold text-gray-900">
                  {formatNumber(dashboardStats?.monthViews || 0)}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Total Stories</h3>
                <p className="text-3xl font-bold text-gray-900">
                  {dashboardStats?.storyCount || 0}
                </p>
              </div>
            </div>

            {/* Follower Growth Chart */}
            {followerGrowth && followerGrowth.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Follower Growth (30 days)</h2>
                <div className="h-48 flex items-end gap-1">
                  {followerGrowth.map((day, i) => {
                    const maxCount = Math.max(...followerGrowth.map((d) => d.count));
                    const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                    return (
                      <div
                        key={day.date}
                        className="flex-1 bg-sky-500 rounded-t hover:bg-sky-600 transition-colors"
                        style={{ height: `${Math.max(height, 2)}%` }}
                        title={`${day.date}: ${day.count} new followers`}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span>30 days ago</span>
                  <span>Today</span>
                </div>
              </div>
            )}

            {/* Top Stories */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Stories</h2>
              {topStories && topStories.length > 0 ? (
                <div className="space-y-3">
                  {topStories.map((story: any) => (
                    <div
                      key={story.id}
                      className={`p-4 rounded-lg cursor-pointer transition-colors ${
                        selectedStory === story.id
                          ? 'bg-sky-50 border border-sky-200'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                      onClick={() => setSelectedStory(story.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-gray-900 truncate">{story.title}</h3>
                          <div className="flex gap-4 mt-1 text-sm text-gray-500">
                            <span>{formatNumber(story.viewCount)} views</span>
                            <span>{formatNumber(story.likeCount)} likes</span>
                            {story.avgRating && (
                              <span>{story.avgRating.toFixed(1)} rating</span>
                            )}
                          </div>
                        </div>
                        <Link href={`/stories/${story.id}`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-gray-500">
                  No stories yet.{' '}
                  <Link href="/write" className="text-sky-600 hover:text-sky-700">
                    Start writing
                  </Link>
                </p>
              )}
            </div>

            {/* Story Analytics Details */}
            {selectedStory && storyAnalytics && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Analytics: {storyAnalytics.story.title}
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(storyAnalytics.story.viewCount)}
                    </p>
                    <p className="text-sm text-gray-500">Total Views</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(storyAnalytics.story.likeCount)}
                    </p>
                    <p className="text-sm text-gray-500">Likes</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">
                      {storyAnalytics.story.reviewCount}
                    </p>
                    <p className="text-sm text-gray-500">Reviews</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">
                      {storyAnalytics.chapterStats?.length || 0}
                    </p>
                    <p className="text-sm text-gray-500">Chapters</p>
                  </div>
                </div>

                {/* Device Breakdown */}
                {storyAnalytics.deviceBreakdown && storyAnalytics.deviceBreakdown.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-medium text-gray-900 mb-2">Readers by Device</h3>
                    <div className="flex gap-4">
                      {storyAnalytics.deviceBreakdown.map((d: any) => (
                        <div key={d.device} className="text-center">
                          <p className="text-lg font-semibold text-gray-900">{d.count}</p>
                          <p className="text-sm text-gray-500 capitalize">{d.device}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top Referrers */}
                {storyAnalytics.referrerBreakdown && storyAnalytics.referrerBreakdown.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-medium text-gray-900 mb-2">Top Referrers</h3>
                    <div className="space-y-2">
                      {storyAnalytics.referrerBreakdown.slice(0, 5).map((r: any) => (
                        <div key={r.referrer} className="flex justify-between">
                          <span className="text-gray-600 truncate">{r.referrer}</span>
                          <span className="font-medium text-gray-900">{r.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chapter Stats */}
                {storyAnalytics.chapterStats && storyAnalytics.chapterStats.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Chapter Performance</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-500 border-b">
                            <th className="py-2 pr-4">Chapter</th>
                            <th className="py-2 px-4">Views</th>
                            <th className="py-2 px-4">Words</th>
                            <th className="py-2 px-4">Avg. Read Time</th>
                            <th className="py-2 px-4">Completion</th>
                          </tr>
                        </thead>
                        <tbody>
                          {storyAnalytics.chapterStats.map((ch: any) => (
                            <tr key={ch.id} className="border-b border-gray-100">
                              <td className="py-2 pr-4">
                                <span className="text-gray-500">Ch. {ch.chapterNumber}:</span>{' '}
                                {ch.title}
                              </td>
                              <td className="py-2 px-4">{formatNumber(ch.views)}</td>
                              <td className="py-2 px-4">{formatNumber(ch.wordCount)}</td>
                              <td className="py-2 px-4">
                                {ch.avgReadingTime
                                  ? `${Math.round(ch.avgReadingTime / 60)}m`
                                  : '-'}
                              </td>
                              <td className="py-2 px-4">
                                {ch.avgScrollDepth
                                  ? `${Math.round(ch.avgScrollDepth)}%`
                                  : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: 'eye' | 'users' | 'heart' | 'star';
}) {
  const icons = {
    eye: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    users: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    heart: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    star: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-sky-100 rounded-lg text-sky-600">{icons[icon]}</div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}
