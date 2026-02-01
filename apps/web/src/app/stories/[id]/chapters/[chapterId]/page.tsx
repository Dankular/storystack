'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { useReaderStore, getReaderCSSVars } from '@/stores/reader';
import { Button } from '@/components/ui';
import { ReaderSettingsPanel, ReaderSettingsButton } from '@/components/reader-settings';

export default function ChapterReadingPage() {
  const params = useParams();
  const storyId = params.id as string;
  const chapterId = params.chapterId as string;
  const { token } = useAuthStore();
  const { settings } = useReaderStore();

  const { data: chapter, isLoading, error } = useQuery({
    queryKey: ['chapter', storyId, chapterId],
    queryFn: () => api.getChapter(storyId, chapterId, token || undefined),
  });

  // Record chapter view
  useEffect(() => {
    if (chapter) {
      api.recordChapterView(chapterId, {
        referrer: document.referrer,
        deviceType: window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop',
      }).catch(() => {});
    }
  }, [chapter, chapterId]);

  const cssVars = getReaderCSSVars(settings);
  const isDark = settings.theme === 'dark';

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: cssVars['--reader-bg'] }}
      >
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-sky-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4" style={{ color: cssVars['--reader-text'] }}>Loading chapter...</p>
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
    <div
      className="min-h-screen transition-colors duration-200"
      style={{
        backgroundColor: cssVars['--reader-bg'],
        color: cssVars['--reader-text'],
      }}
    >
      <header
        className="sticky top-0 border-b z-10 transition-colors duration-200"
        style={{
          backgroundColor: cssVars['--reader-header-bg'],
          borderColor: isDark ? '#333' : '#e5e7eb',
        }}
      >
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href={`/stories/${storyId}`}
            className="text-sm font-medium hover:opacity-80 transition-opacity"
            style={{ color: cssVars['--reader-text'] }}
          >
            &larr; {chapter.story.title}
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-sm opacity-60">
              Chapter {chapter.chapterNumber}
            </span>
            <ReaderSettingsButton />
          </div>
        </div>
      </header>

      <ReaderSettingsPanel />

      <main
        className="mx-auto px-4 py-8 transition-all duration-200"
        style={{ maxWidth: cssVars['--reader-max-width'] }}
      >
        <article>
          <header className="mb-8 text-center">
            <p className="text-sm opacity-60 mb-2">
              Chapter {chapter.chapterNumber}
            </p>
            <h1 className="text-3xl font-bold">
              {chapter.title}
            </h1>
            <p className="mt-2 text-sm opacity-60">
              by{' '}
              <Link
                href={`/user/${chapter.story.author.username}`}
                className="text-sky-600 hover:text-sky-700"
              >
                {chapter.story.author.displayName || chapter.story.author.username}
              </Link>
            </p>
            {chapter.wordCount > 0 && (
              <p className="mt-1 text-xs opacity-50">
                {chapter.wordCount.toLocaleString()} words
              </p>
            )}
          </header>

          {chapter.authorNotesBefore && (
            <div
              className="mb-8 p-4 rounded-lg border"
              style={{
                backgroundColor: isDark ? '#2a3a4a' : '#f0f9ff',
                borderColor: isDark ? '#3a4a5a' : '#bae6fd',
              }}
            >
              <p className="text-sm font-semibold mb-2" style={{ color: isDark ? '#7dd3fc' : '#0369a1' }}>
                Author&apos;s Note
              </p>
              <div className="text-sm whitespace-pre-line opacity-90">
                {chapter.authorNotesBefore}
              </div>
            </div>
          )}

          <div
            className="prose max-w-none"
            style={{
              fontSize: cssVars['--reader-font-size'],
              lineHeight: cssVars['--reader-line-height'],
              fontFamily: cssVars['--reader-font-family'],
              textAlign: cssVars['--reader-text-align'] as 'left' | 'justify',
              color: cssVars['--reader-text'],
            }}
          >
            <div
              className="whitespace-pre-line"
              dangerouslySetInnerHTML={{ __html: chapter.content }}
            />
          </div>

          {chapter.authorNotesAfter && (
            <div
              className="mt-8 p-4 rounded-lg border"
              style={{
                backgroundColor: isDark ? '#2a3a4a' : '#f0f9ff',
                borderColor: isDark ? '#3a4a5a' : '#bae6fd',
              }}
            >
              <p className="text-sm font-semibold mb-2" style={{ color: isDark ? '#7dd3fc' : '#0369a1' }}>
                Author&apos;s Note
              </p>
              <div className="text-sm whitespace-pre-line opacity-90">
                {chapter.authorNotesAfter}
              </div>
            </div>
          )}
        </article>

        <nav
          className="mt-12 pt-8 border-t"
          style={{ borderColor: isDark ? '#333' : '#e5e7eb' }}
        >
          <div className="flex justify-between items-center">
            {chapter.prevChapter ? (
              <Link href={`/stories/${storyId}/chapters/${chapter.prevChapter.id}`}>
                <Button variant="outline">
                  &larr; Previous
                </Button>
              </Link>
            ) : (
              <div />
            )}

            {chapter.nextChapter ? (
              <Link href={`/stories/${storyId}/chapters/${chapter.nextChapter.id}`}>
                <Button>
                  Next &rarr;
                </Button>
              </Link>
            ) : (
              <div className="text-sm opacity-60">
                End of published chapters
              </div>
            )}
          </div>

          {(chapter.prevChapter || chapter.nextChapter) && (
            <div className="mt-4 text-center text-sm opacity-60">
              {chapter.prevChapter && (
                <span className="mr-4">Prev: {chapter.prevChapter.title}</span>
              )}
              {chapter.nextChapter && (
                <span>Next: {chapter.nextChapter.title}</span>
              )}
            </div>
          )}

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
