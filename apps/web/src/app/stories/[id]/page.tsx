'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui';
import { Navbar } from '@/components/navbar';
import { CommentList } from '@/components/comments';
import { ReviewList } from '@/components/reviews';
import { FollowButton } from '@/components/follow-button';
import { StoryFollowButton } from '@/components/story-follow-button';
import { AddToListButton } from '@/components/add-to-list-button';
import { TipButton } from '@/components/tip-button';
import { ExportButton } from '@/components/export-button';

export default function StoryDetailPage() {
  const params = useParams();
  const storyId = params.id as string;
  const { token, user } = useAuthStore();

  const { data: story, isLoading, error } = useQuery({
    queryKey: ['story', storyId],
    queryFn: () => api.getStory(storyId, token || undefined),
  });

  const formatWordCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
    return count.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const statusColors: Record<string, string> = {
    ONGOING: 'bg-green-100 text-green-800',
    COMPLETED: 'bg-blue-100 text-blue-800',
    HIATUS: 'bg-yellow-100 text-yellow-800',
    DRAFT: 'bg-gray-100 text-gray-800',
  };

  const ratingDescriptions: Record<string, string> = {
    GENERAL: 'General Audiences',
    TEEN: 'Teen & Up',
    MATURE: 'Mature',
    EXPLICIT: 'Explicit',
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-sky-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading story...</p>
        </div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Story not found</h1>
          <p className="text-gray-600 mb-6">
            The story you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link href="/stories">
            <Button>Browse Stories</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isAuthor = user?.id === story.author.id;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="md:flex">
            {story.coverImageUrl ? (
              <div className="md:w-64 md:flex-shrink-0">
                <img
                  src={story.coverImageUrl}
                  alt={story.title}
                  className="w-full h-64 md:h-full object-cover"
                />
              </div>
            ) : (
              <div className="md:w-64 md:flex-shrink-0 h-64 md:h-auto bg-gradient-to-br from-sky-100 to-sky-200 flex items-center justify-center">
                <span className="text-sky-400 text-6xl font-bold">
                  {story.title.charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            <div className="p-6 flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{story.title}</h1>
                  <p className="mt-1 text-gray-600">
                    by{' '}
                    <Link
                      href={`/user/${story.author.username}`}
                      className="font-medium text-sky-600 hover:text-sky-700"
                    >
                      {story.author.displayName || story.author.username}
                    </Link>
                  </p>
                </div>

                <div className="flex gap-2">
                  {isAuthor ? (
                    <>
                      <Link href={`/write/${story.id}`}>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </Link>
                      <ExportButton storyId={story.id} storyTitle={story.title} />
                    </>
                  ) : (
                    <>
                      <FollowButton userId={story.author.id} />
                      <StoryFollowButton storyId={story.id} />
                      <AddToListButton storyId={story.id} />
                      <ExportButton storyId={story.id} storyTitle={story.title} />
                      <TipButton
                        authorId={story.author.id}
                        authorName={story.author.displayName || story.author.username}
                        storyId={story.id}
                        storyTitle={story.title}
                      />
                    </>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className={`px-2 py-1 text-sm font-medium rounded ${statusColors[story.status]}`}>
                  {story.status}
                </span>
                <span className="px-2 py-1 text-sm bg-gray-100 text-gray-700 rounded">
                  {ratingDescriptions[story.rating] || story.rating}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {story.tags?.map((tag: any) => (
                  <span
                    key={tag.id}
                    className="px-2 py-1 text-sm bg-sky-50 text-sky-700 rounded"
                  >
                    {tag.canonicalName}
                  </span>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Words</span>
                  <p className="font-semibold">{formatWordCount(story.wordCount)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Chapters</span>
                  <p className="font-semibold">{story.chapterCount}</p>
                </div>
                <div>
                  <span className="text-gray-500">Views</span>
                  <p className="font-semibold">{formatWordCount(story.viewCount)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Likes</span>
                  <p className="font-semibold">{story.likeCount}</p>
                </div>
                <div>
                  <span className="text-gray-500">Rating</span>
                  <p className="font-semibold">
                    {story.avgRating ? `${story.avgRating.toFixed(1)} / 5` : 'No reviews'}
                  </p>
                </div>
              </div>

              {story.publishedAt && (
                <p className="mt-4 text-sm text-gray-500">
                  Published {formatDate(story.publishedAt)}
                </p>
              )}
            </div>
          </div>

          <div className="border-t border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
            <p className="text-gray-700 whitespace-pre-line">{story.description}</p>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Chapters ({story.chapters?.length || 0})
          </h2>

          {story.chapters && story.chapters.length > 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-200">
              {story.chapters.map((chapter: any) => (
                <Link
                  key={chapter.id}
                  href={`/stories/${story.id}/chapters/${chapter.id}`}
                  className="block p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-gray-500">
                        Chapter {chapter.chapterNumber}
                      </span>
                      <h3 className="font-medium text-gray-900">{chapter.title}</h3>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <p>{formatWordCount(chapter.wordCount)} words</p>
                      {chapter.publishedAt && (
                        <p>{formatDate(chapter.publishedAt)}</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-600">
              No chapters published yet.
            </div>
          )}

          {story.chapters && story.chapters.length > 0 && (
            <div className="mt-6 text-center">
              <Link href={`/stories/${story.id}/chapters/${story.chapters[0].id}`}>
                <Button size="lg">Start Reading</Button>
              </Link>
            </div>
          )}
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <ReviewList
            storyId={story.id}
            storyAuthorId={story.author.id}
            avgRating={story.avgRating}
            reviewCount={story.reviewCount}
          />
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <CommentList storyId={story.id} storyAuthorId={story.author.id} />
        </div>
      </main>
    </div>
  );
}
