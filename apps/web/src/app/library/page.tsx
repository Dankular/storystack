'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { Navbar } from '@/components/navbar';
import { Button, Input } from '@/components/ui';

export default function LibraryPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { token, isAuthenticated } = useAuthStore();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [newListPublic, setNewListPublic] = useState(false);

  const { data: lists, isLoading } = useQuery({
    queryKey: ['reading-lists'],
    queryFn: () => api.getMyReadingLists(token!),
    enabled: isAuthenticated && !!token,
  });

  const { data: followedStories } = useQuery({
    queryKey: ['followed-stories'],
    queryFn: () => api.getFollowedStories(token!),
    enabled: isAuthenticated && !!token,
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; isPublic?: boolean }) =>
      api.createReadingList(data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reading-lists'] });
      setShowCreateForm(false);
      setNewListName('');
      setNewListDescription('');
      setNewListPublic(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteReadingList(id, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reading-lists'] });
    },
  });

  // Redirect if not authenticated
  if (!isAuthenticated) {
    if (typeof window !== 'undefined') {
      router.push('/login');
    }
    return null;
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    createMutation.mutate({
      name: newListName.trim(),
      description: newListDescription.trim() || undefined,
      isPublic: newListPublic,
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete "${name}"? This cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Library</h1>
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            {showCreateForm ? 'Cancel' : 'New List'}
          </Button>
        </div>

        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Create Reading List</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                label="Name"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="My Favorites"
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={newListDescription}
                  onChange={(e) => setNewListDescription(e.target.value)}
                  placeholder="A collection of my favorite stories..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newListPublic}
                  onChange={(e) => setNewListPublic(e.target.checked)}
                  className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                />
                <span className="text-sm text-gray-700">Make this list public</span>
              </label>
              <Button type="submit" isLoading={createMutation.isPending}>
                Create List
              </Button>
            </form>
          </div>
        )}

        <div className="space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Reading Lists</h2>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-sky-500 border-t-transparent rounded-full mx-auto"></div>
              </div>
            ) : lists && lists.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {lists.map((list: any) => (
                  <div
                    key={list.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
                  >
                    <Link href={`/library/${list.id}`}>
                      <h3 className="font-semibold text-gray-900 hover:text-sky-600">
                        {list.name}
                      </h3>
                    </Link>
                    {list.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {list.description}
                      </p>
                    )}
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        {list._count?.items || 0} stories
                      </span>
                      <div className="flex items-center gap-2">
                        {list.isPublic && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                            Public
                          </span>
                        )}
                        <button
                          onClick={() => handleDelete(list.id, list.name)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-500">
                No reading lists yet. Create one to start organizing your stories!
              </div>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Followed Stories ({followedStories?.pagination.total || 0})
            </h2>
            {followedStories && followedStories.stories.length > 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-200">
                {followedStories.stories.slice(0, 5).map((story: any) => (
                  <Link
                    key={story.id}
                    href={`/stories/${story.id}`}
                    className="block p-4 hover:bg-gray-50"
                  >
                    <h3 className="font-medium text-gray-900">{story.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      by {story.author.displayName || story.author.username}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-500">
                No followed stories yet. Follow stories to get updates on new chapters!
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
