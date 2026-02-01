'use client';

import { useState, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { StoryCard } from '@/components/stories';
import { Button, Input } from '@/components/ui';
import { Navbar } from '@/components/navbar';

const WORD_COUNT_RANGES = [
  { label: 'Any', min: undefined, max: undefined },
  { label: 'Short (< 10K)', min: undefined, max: 10000 },
  { label: 'Medium (10K - 50K)', min: 10000, max: 50000 },
  { label: 'Long (50K - 100K)', min: 50000, max: 100000 },
  { label: 'Epic (100K+)', min: 100000, max: undefined },
];

const SORT_OPTIONS = [
  { label: 'Recently Updated', value: 'updated' },
  { label: 'Newest', value: 'newest' },
  { label: 'Most Popular', value: 'popular' },
  { label: 'Most Views', value: 'views' },
  { label: 'Highest Rated', value: 'rating' },
];

const CONTENT_RATINGS = [
  { label: 'All Ratings', value: '' },
  { label: 'General', value: 'GENERAL' },
  { label: 'Teen', value: 'TEEN' },
  { label: 'Mature', value: 'MATURE' },
  { label: 'Explicit', value: 'EXPLICIT' },
];

function StoriesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = parseInt(searchParams.get('page') || '1', 10);
  const search = searchParams.get('search') || '';
  const sortBy = (searchParams.get('sortBy') as any) || 'updated';
  const contentRating = searchParams.get('contentRating') || '';
  const minWordCount = searchParams.get('minWordCount');
  const maxWordCount = searchParams.get('maxWordCount');
  const completedOnly = searchParams.get('completedOnly') === 'true';
  const ongoingOnly = searchParams.get('ongoingOnly') === 'true';
  const minRating = searchParams.get('minRating');

  const [searchInput, setSearchInput] = useState(search);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    sortBy,
    contentRating,
    wordCountRange: WORD_COUNT_RANGES.findIndex(
      (r) =>
        r.min === (minWordCount ? parseInt(minWordCount) : undefined) &&
        r.max === (maxWordCount ? parseInt(maxWordCount) : undefined)
    ),
    completedOnly,
    ongoingOnly,
    minRating: minRating ? parseFloat(minRating) : 0,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['stories', page, search, sortBy, contentRating, minWordCount, maxWordCount, completedOnly, ongoingOnly, minRating],
    queryFn: () =>
      api.getStories({
        page,
        limit: 20,
        search: search || undefined,
        sortBy: sortBy as any,
        contentRating: contentRating || undefined,
        minWordCount: minWordCount ? parseInt(minWordCount) : undefined,
        maxWordCount: maxWordCount ? parseInt(maxWordCount) : undefined,
        completedOnly,
        ongoingOnly,
        minRating: minRating ? parseFloat(minRating) : undefined,
      }),
  });

  const buildUrl = (newParams: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const combined = {
      search: searchInput || undefined,
      sortBy: filters.sortBy !== 'updated' ? filters.sortBy : undefined,
      contentRating: filters.contentRating || undefined,
      minWordCount: WORD_COUNT_RANGES[filters.wordCountRange]?.min?.toString(),
      maxWordCount: WORD_COUNT_RANGES[filters.wordCountRange]?.max?.toString(),
      completedOnly: filters.completedOnly ? 'true' : undefined,
      ongoingOnly: filters.ongoingOnly ? 'true' : undefined,
      minRating: filters.minRating > 0 ? filters.minRating.toString() : undefined,
      page: '1',
      ...newParams,
    };

    Object.entries(combined).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });

    return `/stories?${params.toString()}`;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(buildUrl({}));
  };

  const handleApplyFilters = () => {
    router.push(buildUrl({}));
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setFilters({
      sortBy: 'updated',
      contentRating: '',
      wordCountRange: 0,
      completedOnly: false,
      ongoingOnly: false,
      minRating: 0,
    });
    setSearchInput('');
    router.push('/stories');
    setShowFilters(false);
  };

  const handlePageChange = (newPage: number) => {
    router.push(buildUrl({ page: newPage.toString() }));
  };

  const hasActiveFilters =
    contentRating ||
    minWordCount ||
    maxWordCount ||
    completedOnly ||
    ongoingOnly ||
    minRating ||
    sortBy !== 'updated';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Browse Stories</h1>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-4">
          <div className="flex gap-2">
            <Input
              type="search"
              placeholder="Search stories..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">Search</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="relative"
            >
              Filters
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-sky-500 rounded-full" />
              )}
            </Button>
          </div>
        </form>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Content Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content Rating</label>
                <select
                  value={filters.contentRating}
                  onChange={(e) => setFilters({ ...filters, contentRating: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {CONTENT_RATINGS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Word Count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Word Count</label>
                <select
                  value={filters.wordCountRange}
                  onChange={(e) => setFilters({ ...filters, wordCountRange: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {WORD_COUNT_RANGES.map((opt, i) => (
                    <option key={i} value={i}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Minimum Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Rating: {filters.minRating > 0 ? `${filters.minRating}+` : 'Any'}
                </label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={filters.minRating}
                  onChange={(e) => setFilters({ ...filters, minRating: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* Status Filters */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.completedOnly}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        completedOnly: e.target.checked,
                        ongoingOnly: e.target.checked ? false : filters.ongoingOnly,
                      })
                    }
                    className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span className="text-sm text-gray-700">Completed Only</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.ongoingOnly}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        ongoingOnly: e.target.checked,
                        completedOnly: e.target.checked ? false : filters.completedOnly,
                      })
                    }
                    className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span className="text-sm text-gray-700">Ongoing Only</span>
                </label>
              </div>
            </div>

            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
              <Button onClick={handleApplyFilters}>Apply Filters</Button>
              <Button variant="outline" onClick={handleClearFilters}>
                Clear All
              </Button>
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {hasActiveFilters && !showFilters && (
          <div className="flex flex-wrap gap-2 mb-4">
            {sortBy !== 'updated' && (
              <span className="px-2 py-1 bg-sky-100 text-sky-700 text-sm rounded">
                Sort: {SORT_OPTIONS.find((s) => s.value === sortBy)?.label}
              </span>
            )}
            {contentRating && (
              <span className="px-2 py-1 bg-sky-100 text-sky-700 text-sm rounded">
                Rating: {CONTENT_RATINGS.find((r) => r.value === contentRating)?.label}
              </span>
            )}
            {(minWordCount || maxWordCount) && (
              <span className="px-2 py-1 bg-sky-100 text-sky-700 text-sm rounded">
                {minWordCount && `${parseInt(minWordCount).toLocaleString()}+`}
                {minWordCount && maxWordCount && ' - '}
                {maxWordCount && `${parseInt(maxWordCount).toLocaleString()}`} words
              </span>
            )}
            {completedOnly && (
              <span className="px-2 py-1 bg-sky-100 text-sky-700 text-sm rounded">Completed</span>
            )}
            {ongoingOnly && (
              <span className="px-2 py-1 bg-sky-100 text-sky-700 text-sm rounded">Ongoing</span>
            )}
            {minRating && parseFloat(minRating) > 0 && (
              <span className="px-2 py-1 bg-sky-100 text-sky-700 text-sm rounded">
                {minRating}+ stars
              </span>
            )}
            <button
              onClick={handleClearFilters}
              className="px-2 py-1 text-sm text-gray-500 hover:text-gray-700"
            >
              Clear all
            </button>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-sky-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading stories...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-red-600">Failed to load stories. Please try again.</p>
          </div>
        )}

        {data && (
          <>
            <p className="text-sm text-gray-500 mb-4">
              {data.pagination.total} {data.pagination.total === 1 ? 'story' : 'stories'} found
            </p>

            {data.stories.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">
                  {search ? `No stories found for "${search}"` : 'No stories match your filters.'}
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" className="mt-4" onClick={handleClearFilters}>
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {data.stories.map((story) => (
                  <StoryCard key={story.id} story={story} />
                ))}
              </div>
            )}

            {data.pagination.totalPages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                <Button
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => handlePageChange(page - 1)}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4 text-sm text-gray-600">
                  Page {page} of {data.pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={page >= data.pagination.totalPages}
                  onClick={() => handlePageChange(page + 1)}
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

function StoriesLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Browse Stories</h1>
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-sky-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </main>
    </div>
  );
}

export default function StoriesPage() {
  return (
    <Suspense fallback={<StoriesLoading />}>
      <StoriesContent />
    </Suspense>
  );
}
