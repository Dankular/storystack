'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui';

export default function ChapterReadingPage() {
  const params = useParams();
  const storyId = params.id as string;
  const chapterId = params.chapterId as string;
  const { token } = useAuthStore();

  const { data: chapter, isLoading, error } = useQuery({
    queryKey: ['chapter', storyId, chapterId],
    queryFn: () => api.getChapter(storyId, chapterId, token || undefined),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--reader-bg,#f8f9fa)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-sky-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading chapter...</p>
        </div>
      </div>
    );
  }

  if (error || !chapter) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Chapter not found</h1>
          <Link href={`/stories/${storyId}`}>
            <Button>Back to Story</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--reader-bg,#f8f9fa)]">
      <header className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href={`/stories/${storyId}`}
            className="text-gray-600 hover:text-gray-900 text-sm font-medium"
          >
            &larr; {chapter.story.title}
          </Link>
          <span className="text-sm text-gray-500">
            Chapter {chapter.chapterNumber}
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <article>
          <header className="mb-8 text-center">
            <p className="text-sm text-gray-500 mb-2">
              Chapter {chapter.chapterNumber}
            </p>
            <h1 className="text-3xl font-bold text-gray-900">
              {chapter.title}
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              by{' '}
              <Link
                href={`/user/${chapter.story.author.username}`}
                className="text-sky-600 hover:text-sky-700"
              >
                {chapter.story.author.displayName || chapter.story.author.username}
              </Link>
            </p>
          </header>

          {chapter.authorNotesBefore && (
            <div className="mb-8 p-4 bg-sky-50 rounded-lg border border-sky-100">
              <p className="text-sm font-semibold text-sky-800 mb-2">Author&apos;s Note</p>
              <div className="text-sm text-sky-900 whitespace-pre-line">
                {chapter.authorNotesBefore}
              </div>
            </div>
          )}

          <div
            className="prose prose-lg max-w-none"
            style={{
              fontSize: 'var(--reader-font-size, 18px)',
              lineHeight: 'var(--reader-line-height, 1.8)',
              fontFamily: 'var(--reader-font-family, Georgia, serif)',
            }}
          >
            <div
              className="whitespace-pre-line text-gray-800"
              dangerouslySetInnerHTML={{ __html: chapter.content }}
            />
          </div>

          {chapter.authorNotesAfter && (
            <div className="mt-8 p-4 bg-sky-50 rounded-lg border border-sky-100">
              <p className="text-sm font-semibold text-sky-800 mb-2">Author&apos;s Note</p>
              <div className="text-sm text-sky-900 whitespace-pre-line">
                {chapter.authorNotesAfter}
              </div>
            </div>
          )}
        </article>

        <nav className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex justify-between items-center">
            {chapter.prevChapter ? (
              <Link href={`/stories/${storyId}/chapters/${chapter.prevChapter.id}`}>
                <Button variant="outline">
                  &larr; Previous: {chapter.prevChapter.title}
                </Button>
              </Link>
            ) : (
              <div />
            )}

            {chapter.nextChapter ? (
              <Link href={`/stories/${storyId}/chapters/${chapter.nextChapter.id}`}>
                <Button>
                  Next: {chapter.nextChapter.title} &rarr;
                </Button>
              </Link>
            ) : (
              <div className="text-gray-500 text-sm">
                End of published chapters
              </div>
            )}
          </div>

          <div className="mt-6 text-center">
            <Link
              href={`/stories/${storyId}`}
              className="text-sm text-sky-600 hover:text-sky-700"
            >
              View all chapters
            </Link>
          </div>
        </nav>
      </main>
    </div>
  );
}
