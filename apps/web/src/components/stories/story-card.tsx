import Link from 'next/link';

interface StoryCardProps {
  story: {
    id: string;
    title: string;
    description: string;
    coverImageUrl?: string;
    author: {
      id: string;
      username: string;
      displayName?: string;
    };
    status: string;
    rating: string;
    wordCount: number;
    chapterCount: number;
    likeCount: number;
    tags: { id: string; canonicalName: string; type: string }[];
    updatedAt: string;
  };
}

export function StoryCard({ story }: StoryCardProps) {
  const formatWordCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
    return count.toString();
  };

  const statusColors: Record<string, string> = {
    ONGOING: 'bg-green-100 text-green-800',
    COMPLETED: 'bg-blue-100 text-blue-800',
    HIATUS: 'bg-yellow-100 text-yellow-800',
    DRAFT: 'bg-gray-100 text-gray-800',
  };

  const ratingBadges: Record<string, string> = {
    GENERAL: 'G',
    TEEN: 'T',
    MATURE: 'M',
    EXPLICIT: 'E',
  };

  return (
    <Link href={`/stories/${story.id}`}>
      <article className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        <div className="flex">
          {story.coverImageUrl ? (
            <div className="w-24 h-32 sm:w-32 sm:h-40 flex-shrink-0">
              <img
                src={story.coverImageUrl}
                alt={story.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-24 h-32 sm:w-32 sm:h-40 flex-shrink-0 bg-gradient-to-br from-sky-100 to-sky-200 flex items-center justify-center">
              <span className="text-sky-400 text-4xl font-bold">
                {story.title.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          <div className="flex-1 p-4 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {story.title}
              </h3>
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${statusColors[story.status] || 'bg-gray-100'}`}>
                  {story.status}
                </span>
                <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-700">
                  {ratingBadges[story.rating] || 'G'}
                </span>
              </div>
            </div>

            <p className="text-sm text-gray-600 mt-1">
              by{' '}
              <span className="font-medium text-gray-900">
                {story.author.displayName || story.author.username}
              </span>
            </p>

            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
              {story.description}
            </p>

            <div className="mt-3 flex flex-wrap gap-1">
              {story.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag.id}
                  className="px-2 py-0.5 text-xs bg-sky-50 text-sky-700 rounded"
                >
                  {tag.canonicalName}
                </span>
              ))}
              {story.tags.length > 3 && (
                <span className="px-2 py-0.5 text-xs text-gray-500">
                  +{story.tags.length - 3} more
                </span>
              )}
            </div>

            <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
              <span>{formatWordCount(story.wordCount)} words</span>
              <span>{story.chapterCount} chapters</span>
              <span>{story.likeCount} likes</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
