const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface FetchOptions extends RequestInit {
  token?: string;
}

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: any,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data?.message || 'An error occurred',
      data,
    );
  }

  return data;
}

export const api = {
  // Auth
  register: (data: { email: string; username: string; password: string; displayName?: string }) =>
    fetchApi<{ user: any; accessToken: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { emailOrUsername: string; password: string }) =>
    fetchApi<{ user: any; accessToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMe: (token: string) =>
    fetchApi<{ user: any }>('/auth/me', { token }),

  // Stories
  getStories: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    minWordCount?: number;
    maxWordCount?: number;
    minChapters?: number;
    maxChapters?: number;
    contentRating?: string;
    tagIds?: string[];
    excludeTagIds?: string[];
    minRating?: number;
    sortBy?: 'newest' | 'popular' | 'views' | 'rating' | 'updated';
    completedOnly?: boolean;
    ongoingOnly?: boolean;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.minWordCount) searchParams.set('minWordCount', params.minWordCount.toString());
    if (params?.maxWordCount) searchParams.set('maxWordCount', params.maxWordCount.toString());
    if (params?.minChapters) searchParams.set('minChapters', params.minChapters.toString());
    if (params?.maxChapters) searchParams.set('maxChapters', params.maxChapters.toString());
    if (params?.contentRating) searchParams.set('contentRating', params.contentRating);
    if (params?.tagIds?.length) searchParams.set('tagIds', params.tagIds.join(','));
    if (params?.excludeTagIds?.length) searchParams.set('excludeTagIds', params.excludeTagIds.join(','));
    if (params?.minRating) searchParams.set('minRating', params.minRating.toString());
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params?.completedOnly) searchParams.set('completedOnly', 'true');
    if (params?.ongoingOnly) searchParams.set('ongoingOnly', 'true');
    const query = searchParams.toString();
    return fetchApi<{ stories: any[]; pagination: any }>(`/stories${query ? `?${query}` : ''}`);
  },

  getSimilarStories: (storyId: string, limit = 5) =>
    fetchApi<any[]>(`/stories/${storyId}/similar?limit=${limit}`),

  getStory: (id: string, token?: string) =>
    fetchApi<any>(`/stories/${id}`, { token }),

  createStory: (data: any, token: string) =>
    fetchApi<any>('/stories', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),

  updateStory: (id: string, data: any, token: string) =>
    fetchApi<any>(`/stories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    }),

  deleteStory: (id: string, token: string) =>
    fetchApi<any>(`/stories/${id}`, {
      method: 'DELETE',
      token,
    }),

  // Chapters
  getChapters: (storyId: string, token?: string) =>
    fetchApi<any[]>(`/stories/${storyId}/chapters`, { token }),

  getChapter: (storyId: string, chapterId: string, token?: string) =>
    fetchApi<any>(`/stories/${storyId}/chapters/${chapterId}`, { token }),

  createChapter: (storyId: string, data: any, token: string) =>
    fetchApi<any>(`/stories/${storyId}/chapters`, {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),

  updateChapter: (storyId: string, chapterId: string, data: any, token: string) =>
    fetchApi<any>(`/stories/${storyId}/chapters/${chapterId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    }),

  // Tags
  getTags: (params?: { type?: string; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.set('type', params.type);
    if (params?.search) searchParams.set('search', params.search);
    const query = searchParams.toString();
    return fetchApi<any[]>(`/tags${query ? `?${query}` : ''}`);
  },

  searchTags: (query: string) =>
    fetchApi<any[]>(`/tags/search?q=${encodeURIComponent(query)}`),

  // Comments
  getStoryComments: (storyId: string, page = 1) =>
    fetchApi<{ comments: any[]; pagination: any }>(`/comments/story/${storyId}?page=${page}`),

  getChapterComments: (chapterId: string, page = 1) =>
    fetchApi<{ comments: any[]; pagination: any }>(`/comments/chapter/${chapterId}?page=${page}`),

  createComment: (data: { content: string; storyId?: string; chapterId?: string; parentId?: string }, token: string) =>
    fetchApi<any>('/comments', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),

  updateComment: (id: string, content: string, token: string) =>
    fetchApi<any>(`/comments/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
      token,
    }),

  deleteComment: (id: string, token: string) =>
    fetchApi<any>(`/comments/${id}`, {
      method: 'DELETE',
      token,
    }),

  // Follows
  followUser: (userId: string, token: string) =>
    fetchApi<any>(`/users/${userId}/follow`, {
      method: 'POST',
      token,
    }),

  unfollowUser: (userId: string, token: string) =>
    fetchApi<any>(`/users/${userId}/follow`, {
      method: 'DELETE',
      token,
    }),

  getFollowers: (userId: string, page = 1) =>
    fetchApi<{ users: any[]; pagination: any }>(`/users/${userId}/followers?page=${page}`),

  getFollowing: (userId: string, page = 1) =>
    fetchApi<{ users: any[]; pagination: any }>(`/users/${userId}/following?page=${page}`),

  isFollowingUser: (userId: string, token: string) =>
    fetchApi<{ isFollowing: boolean }>(`/users/${userId}/is-following`, { token }),

  followStory: (storyId: string, token: string) =>
    fetchApi<any>(`/stories/${storyId}/follow`, {
      method: 'POST',
      token,
    }),

  unfollowStory: (storyId: string, token: string) =>
    fetchApi<any>(`/stories/${storyId}/follow`, {
      method: 'DELETE',
      token,
    }),

  isFollowingStory: (storyId: string, token: string) =>
    fetchApi<{ isFollowing: boolean; notifyUpdates: boolean }>(`/stories/${storyId}/is-following`, { token }),

  getFollowedStories: (token: string, page = 1) =>
    fetchApi<{ stories: any[]; pagination: any }>(`/me/followed-stories?page=${page}`, { token }),

  // Notifications
  getNotifications: (token: string, page = 1, unreadOnly = false) =>
    fetchApi<{ notifications: any[]; unreadCount: number; pagination: any }>(
      `/notifications?page=${page}&unreadOnly=${unreadOnly}`,
      { token }
    ),

  markNotificationRead: (id: string, token: string) =>
    fetchApi<any>(`/notifications/${id}/read`, {
      method: 'POST',
      token,
    }),

  markAllNotificationsRead: (token: string) =>
    fetchApi<any>('/notifications/read-all', {
      method: 'POST',
      token,
    }),

  // Reading Lists
  getMyReadingLists: (token: string) =>
    fetchApi<any[]>('/reading-lists/me', { token }),

  getReadingList: (id: string, token?: string) =>
    fetchApi<any>(`/reading-lists/${id}`, { token }),

  createReadingList: (data: { name: string; description?: string; isPublic?: boolean }, token: string) =>
    fetchApi<any>('/reading-lists', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),

  updateReadingList: (id: string, data: { name?: string; description?: string; isPublic?: boolean }, token: string) =>
    fetchApi<any>(`/reading-lists/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    }),

  deleteReadingList: (id: string, token: string) =>
    fetchApi<any>(`/reading-lists/${id}`, {
      method: 'DELETE',
      token,
    }),

  addToReadingList: (listId: string, storyId: string, token: string, note?: string) =>
    fetchApi<any>(`/reading-lists/${listId}/stories`, {
      method: 'POST',
      body: JSON.stringify({ storyId, note }),
      token,
    }),

  removeFromReadingList: (listId: string, storyId: string, token: string) =>
    fetchApi<any>(`/reading-lists/${listId}/stories/${storyId}`, {
      method: 'DELETE',
      token,
    }),

  // User Profile
  getUser: (username: string) =>
    fetchApi<any>(`/users/${username}`),

  // Reviews
  getStoryReviews: (storyId: string, page = 1, limit = 10) =>
    fetchApi<{ reviews: any[]; ratingDistribution: Record<number, number>; pagination: any }>(
      `/reviews/story/${storyId}?page=${page}&limit=${limit}`
    ),

  getMyReview: (storyId: string, token: string) =>
    fetchApi<any | null>(`/reviews/story/${storyId}/my-review`, { token }),

  createReview: (data: { storyId: string; rating: number; title?: string; content: string }, token: string) =>
    fetchApi<any>('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),

  updateReview: (id: string, data: { rating?: number; title?: string; content?: string }, token: string) =>
    fetchApi<any>(`/reviews/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    }),

  deleteReview: (id: string, token: string) =>
    fetchApi<any>(`/reviews/${id}`, {
      method: 'DELETE',
      token,
    }),

  // Monetisation
  getMonetisationProfile: (token: string) =>
    fetchApi<any>('/monetisation/profile', { token }),

  updateMonetisationProfile: (data: { tipsEnabled?: boolean; minimumTipAmount?: number }, token: string) =>
    fetchApi<any>('/monetisation/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    }),

  createStripeConnectLink: (returnUrl: string, token: string) =>
    fetchApi<{ url: string }>('/monetisation/connect', {
      method: 'POST',
      body: JSON.stringify({ returnUrl }),
      token,
    }),

  getStripeConnectStatus: (token: string) =>
    fetchApi<{ onboarded: boolean; canReceivePayments: boolean }>('/monetisation/connect/status', { token }),

  canAuthorReceiveTips: (userId: string) =>
    fetchApi<{ canReceiveTips: boolean; minimumTipAmount?: number }>(`/monetisation/author/${userId}/tips-enabled`),

  createTip: (data: { recipientId: string; amount: number; message?: string; storyId?: string }, token: string) =>
    fetchApi<{ clientSecret: string; tipId: string }>('/monetisation/tips', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),

  confirmTip: (paymentIntentId: string, token: string) =>
    fetchApi<{ success: boolean }>('/monetisation/tips/confirm', {
      method: 'POST',
      body: JSON.stringify({ paymentIntentId }),
      token,
    }),

  getTipsReceived: (token: string, page = 1) =>
    fetchApi<{ tips: any[]; pagination: any }>(`/monetisation/tips/received?page=${page}`, { token }),

  getTipsSent: (token: string, page = 1) =>
    fetchApi<{ tips: any[]; pagination: any }>(`/monetisation/tips/sent?page=${page}`, { token }),

  getTipStats: (token: string) =>
    fetchApi<{ totalReceived: number; tipCount: number; thisMonth: number }>('/monetisation/tips/stats', { token }),

  // Analytics
  recordStoryView: (storyId: string, data?: { country?: string; referrer?: string; deviceType?: string }) =>
    fetchApi<any>('/analytics/views/story', {
      method: 'POST',
      body: JSON.stringify({ storyId, ...data }),
    }),

  recordChapterView: (chapterId: string, data?: { readingTime?: number; scrollDepth?: number; country?: string; referrer?: string; deviceType?: string }) =>
    fetchApi<any>('/analytics/views/chapter', {
      method: 'POST',
      body: JSON.stringify({ chapterId, ...data }),
    }),

  updateChapterView: (viewId: string, data: { readingTime?: number; scrollDepth?: number; completed?: boolean }) =>
    fetchApi<any>('/analytics/views/chapter', {
      method: 'PUT',
      body: JSON.stringify({ viewId, ...data }),
    }),

  getAnalyticsDashboard: (token: string) =>
    fetchApi<{
      totalViews: number;
      todayViews: number;
      weekViews: number;
      monthViews: number;
      totalFollowers: number;
      totalLikes: number;
      totalReviews: number;
      storyCount: number;
    }>('/analytics/dashboard', { token }),

  getStoryAnalytics: (storyId: string, token: string) =>
    fetchApi<any>(`/analytics/stories/${storyId}`, { token }),

  getFollowerGrowth: (token: string, days = 30) =>
    fetchApi<{ date: string; count: number }[]>(`/analytics/followers/growth?days=${days}`, { token }),

  getTopStories: (token: string, limit = 5) =>
    fetchApi<any[]>(`/analytics/top-stories?limit=${limit}`, { token }),
};

export { ApiError };
