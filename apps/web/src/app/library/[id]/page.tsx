'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui';
import { StoryCard } from '@/components/stories';

export default function ReadingListDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const listId = params.id as string;
  const { token, user } = useAuthStore();

  const { data: list, isLoading, error } = useQuery({
    queryKey: ['reading-list', listId],
    queryFn: () => api.getReadingList(listId, token || undefined),
  });

  const removeMutation = useMutation({
    mutationFn: (storyId: string) => api.removeFromReadingList(listId, storyId, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reading-list', listId] });
    },
  });

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

  if (error || !list) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Reading list not found</h1>
          <Link href="/library">
            <Button>Back to Library</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === list.userId;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/library"
            className="text-sm text-sky-600 hover:text-sky-700 mb-2 inline-block"
          >
            &larr; Back to Library
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{list.name}</h1>
              {list.description && (
                <p className="mt-2 text-gray-600">{list.description}</p>
              )}
              <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                <span>
                  by{' '}
                  <Link
                    href={`/user/${list.user.username}`}
                    className="text-sky-600 hover:text-sky-700"
                  >
                    {list.user.displayName || list.user.username}
                  </Link>
                </span>
                <span>{list._count?.items || 0} stories</span>
                {list.isPublic && (
                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">
                    Public
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {list.items && list.items.length > 0 ? (
          <div className="space-y-4">
            {list.items.map((item: any) => (
              <div key={item.id} className="relative">
                <StoryCard story={item.story} />
                {item.note && (
                  <div className="mt-2 ml-4 p-2 bg-yellow-50 border-l-4 border-yellow-300 text-sm text-yellow-800">
                    <strong>Note:</strong> {item.note}
                  </div>
                )}
                {isOwner && (
                  <button
                    onClick={() => removeMutation.mutate(item.story.id)}
                    className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500"
                    title="Remove from list"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-500">
            This list is empty. Add some stories to get started!
          </div>
        )}
      </main>
    </div>
  );
}
