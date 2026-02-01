'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui';

export default function NotificationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { token, isAuthenticated } = useAuthStore();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', page],
    queryFn: () => api.getNotifications(token!, page, false),
    enabled: isAuthenticated && !!token,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.markNotificationRead(id, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.markAllNotificationsRead(token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Redirect if not authenticated
  if (!isAuthenticated) {
    if (typeof window !== 'undefined') {
      router.push('/login');
    }
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getNotificationLink = (notification: any) => {
    const notifData = notification.data || {};
    switch (notification.type) {
      case 'NEW_CHAPTER':
        return `/stories/${notifData.storyId}/chapters/${notifData.chapterId}`;
      case 'NEW_FOLLOWER':
        return `/user/${notifData.followerId}`;
      case 'COMMENT_ON_STORY':
      case 'STORY_LIKE':
      case 'COMMENT_REPLY':
        return `/stories/${notifData.storyId}`;
      default:
        return '#';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'NEW_CHAPTER':
        return '📖';
      case 'NEW_FOLLOWER':
        return '👤';
      case 'COMMENT_ON_STORY':
      case 'COMMENT_REPLY':
        return '💬';
      case 'STORY_LIKE':
        return '❤️';
      default:
        return '🔔';
    }
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.isRead) {
      markReadMutation.mutate(notification.id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {data && data.unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
            >
              Mark all as read
            </Button>
          )}
        </div>

        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-sky-500 border-t-transparent rounded-full mx-auto"></div>
          </div>
        )}

        {data && (
          <>
            {data.notifications.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <p className="text-gray-500">No notifications yet</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-200">
                {data.notifications.map((notification: any) => (
                  <Link
                    key={notification.id}
                    href={getNotificationLink(notification)}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        !notification.isRead ? 'bg-sky-50' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        <span className="text-2xl">
                          {getNotificationIcon(notification.type)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-gray-900 ${!notification.isRead ? 'font-medium' : ''}`}>
                            {notification.message}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {formatDate(notification.createdAt)}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-sky-500 rounded-full mt-2"></div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {data.pagination.totalPages > 1 && (
              <div className="mt-6 flex justify-center gap-2">
                <Button
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4 text-sm text-gray-600">
                  Page {page} of {data.pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={page >= data.pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
