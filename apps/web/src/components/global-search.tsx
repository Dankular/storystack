'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Input } from '@/components/ui';

export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['globalSearch', query],
    queryFn: () => api.searchAll(query),
    enabled: query.length >= 2,
    staleTime: 30000,
  });

  const allResults = [
    ...(data?.stories?.stories || []).map((s: any) => ({ type: 'story', ...s })),
    ...(data?.users?.users || []).map((u: any) => ({ type: 'user', ...u })),
    ...(data?.tags?.tags || []).map((t: any) => ({ type: 'tag', ...t })),
  ];

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/stories?search=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
      setQuery('');
    }
  }, [query, router]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen || allResults.length === 0) {
      if (e.key === 'Enter') {
        handleSubmit(e);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < allResults.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : allResults.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && allResults[selectedIndex]) {
          const item = allResults[selectedIndex];
          if (item.type === 'story') {
            router.push(`/stories/${item.id}`);
          } else if (item.type === 'user') {
            router.push(`/user/${item.username}`);
          } else if (item.type === 'tag') {
            router.push(`/stories?tagIds=${item.id}`);
          }
          setIsOpen(false);
          setQuery('');
        } else {
          handleSubmit(e);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  }, [isOpen, allResults, selectedIndex, handleSubmit, router]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [query]);

  const hasResults = allResults.length > 0;

  return (
    <div ref={containerRef} className="relative w-64">
      <form onSubmit={handleSubmit}>
        <Input
          ref={inputRef}
          type="search"
          placeholder="Search stories, authors, tags..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full text-sm"
        />
      </form>

      {isOpen && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500 text-sm">Searching...</div>
          ) : !hasResults ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              No results found for "{query}"
            </div>
          ) : (
            <div>
              {/* Stories */}
              {data?.stories?.stories && data.stories.stories.length > 0 && (
                <div className="border-b border-gray-100">
                  <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
                    Stories
                  </div>
                  {data.stories.stories.map((story: any, idx: number) => {
                    const globalIdx = idx;
                    return (
                      <Link
                        key={story.id}
                        href={`/stories/${story.id}`}
                        onClick={() => {
                          setIsOpen(false);
                          setQuery('');
                        }}
                        className={`block px-3 py-2 hover:bg-gray-50 ${
                          selectedIndex === globalIdx ? 'bg-sky-50' : ''
                        }`}
                      >
                        <div className="font-medium text-gray-900 text-sm truncate">
                          {story.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          by {story.author?.displayName || story.author?.username}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Users */}
              {data?.users?.users && data.users.users.length > 0 && (
                <div className="border-b border-gray-100">
                  <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
                    Authors
                  </div>
                  {data.users.users.map((user: any, idx: number) => {
                    const globalIdx = (data?.stories?.stories?.length || 0) + idx;
                    return (
                      <Link
                        key={user.id}
                        href={`/user/${user.username}`}
                        onClick={() => {
                          setIsOpen(false);
                          setQuery('');
                        }}
                        className={`block px-3 py-2 hover:bg-gray-50 ${
                          selectedIndex === globalIdx ? 'bg-sky-50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt={user.username}
                              className="w-6 h-6 rounded-full"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 text-xs font-medium">
                              {(user.displayName || user.username)[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-900 text-sm">
                              {user.displayName || user.username}
                            </div>
                            <div className="text-xs text-gray-500">@{user.username}</div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Tags */}
              {data?.tags?.tags && data.tags.tags.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
                    Tags
                  </div>
                  <div className="p-2 flex flex-wrap gap-1">
                    {data.tags.tags.map((tag: any, idx: number) => {
                      const globalIdx =
                        (data?.stories?.stories?.length || 0) +
                        (data?.users?.users?.length || 0) +
                        idx;
                      return (
                        <Link
                          key={tag.id}
                          href={`/stories?tagIds=${tag.id}`}
                          onClick={() => {
                            setIsOpen(false);
                            setQuery('');
                          }}
                          className={`px-2 py-1 text-xs rounded-full ${
                            selectedIndex === globalIdx
                              ? 'bg-sky-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {tag.canonicalName}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* View all link */}
              <Link
                href={`/stories?search=${encodeURIComponent(query)}`}
                onClick={() => {
                  setIsOpen(false);
                  setQuery('');
                }}
                className="block px-3 py-2 text-center text-sm text-sky-600 hover:bg-sky-50 border-t border-gray-100"
              >
                View all results for "{query}"
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
