'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui';
import { FollowButton } from '@/components/follow-button';
import { TipButton } from '@/components/tip-button';
import { StoryCard } from '@/components/stories';

type Tab = 'stories' | 'followers' | 'following';

export default function UserProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { token } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('stories');

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['user', username],
    queryFn: () => api.getUser(username),
  });

  const { data: storiesData } = useQuery({
    queryKey: ['user', username, 'stories'],
    queryFn: () => api.getStories({ authorId: profile?.id } as any),
    enabled: !!profile && activeTab === 'stories',
  });

  const { data: followersData } = useQuery({
    queryKey: ['user', profile?.id, 'followers'],
    queryFn: () => api.getFollowers(profile!.id),
    enabled: !!profile && activeTab === 'followers',
  });

  const { data: followingData } = useQuery({
    queryKey: ['user', profile?.id, 'following'],
    queryFn: () => api.getFollowing(profile!.id),
    enabled: !!profile && activeTab === 'following',
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-sky-500 border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">User not found</h1>
          <Link href="/stories">
            <Button>Browse Stories</Button>
          </Link>
        </div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'stories', label: 'Stories', count: profile.storyCount },
    { key: 'followers', label: 'Followers', count: profile.followerCount },
    { key: 'following', label: 'Following', count: profile.followingCount },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-start gap-6">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.username}
                className="w-24 h-24 rounded-full"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-sky-100 flex items-center justify-center">
                <span className="text-sky-600 text-3xl font-bold">
                  {(profile.displayName || profile.username).charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {profile.displayName || profile.username}
                  </h1>
                  <p className="text-gray-500">@{profile.username}</p>
                </div>
                <div className="flex gap-2">
                  <FollowButton userId={profile.id} size="md" />
                  <TipButton
                    authorId={profile.id}
                    authorName={profile.displayName || profile.username}
                    size="md"
                  />
                </div>
              </div>

              {profile.bio && (
                <p className="mt-4 text-gray-700">{profile.bio}</p>
              )}

              <p className="mt-4 text-sm text-gray-500">
                Joined {formatDate(profile.createdAt)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="border-b border-gray-200">
            <nav className="flex gap-8">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? 'border-sky-500 text-sky-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-6">
            {activeTab === 'stories' && (
              <div className="space-y-4">
                {storiesData?.stories?.length === 0 && (
                  <p className="text-center py-8 text-gray-500">No stories yet</p>
                )}
                {storiesData?.stories?.map((story: any) => (
                  <StoryCard key={story.id} story={story} />
                ))}
              </div>
            )}

            {activeTab === 'followers' && (
              <div className="space-y-4">
                {followersData?.users?.length === 0 && (
                  <p className="text-center py-8 text-gray-500">No followers yet</p>
                )}
                {followersData?.users?.map((user: any) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            )}

            {activeTab === 'following' && (
              <div className="space-y-4">
                {followingData?.users?.length === 0 && (
                  <p className="text-center py-8 text-gray-500">Not following anyone yet</p>
                )}
                {followingData?.users?.map((user: any) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function UserCard({ user }: { user: any }) {
  return (
    <Link href={`/user/${user.username}`}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-4">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.username}
              className="w-12 h-12 rounded-full"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center">
              <span className="text-sky-600 font-bold">
                {(user.displayName || user.username).charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate">
              {user.displayName || user.username}
            </h3>
            <p className="text-sm text-gray-500">@{user.username}</p>
          </div>
          <FollowButton userId={user.id} />
        </div>
        {user.bio && (
          <p className="mt-2 text-sm text-gray-600 line-clamp-2">{user.bio}</p>
        )}
      </div>
    </Link>
  );
}
