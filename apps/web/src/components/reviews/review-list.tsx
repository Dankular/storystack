'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui';
import { StarRating } from './star-rating';
import { ReviewForm } from './review-form';
import { ReviewItem } from './review-item';

interface ReviewListProps {
  storyId: string;
  storyAuthorId: string;
  avgRating?: number | null;
  reviewCount?: number;
}

export function ReviewList({ storyId, storyAuthorId, avgRating, reviewCount = 0 }: ReviewListProps) {
  const { token, user, isAuthenticated } = useAuthStore();
  const [page, setPage] = useState(1);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['reviews', storyId, page],
    queryFn: () => api.getStoryReviews(storyId, page),
  });

  const { data: myReview } = useQuery({
    queryKey: ['my-review', storyId],
    queryFn: () => api.getMyReview(storyId, token!),
    enabled: isAuthenticated && !!token,
  });

  const isAuthor = user?.id === storyAuthorId;
  const hasReviewed = !!myReview;

  const renderRatingBar = (stars: number, count: number, total: number) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return (
      <div key={stars} className="flex items-center gap-2 text-sm">
        <span className="w-3 text-gray-600">{stars}</span>
        <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-yellow-400 rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="w-8 text-gray-500 text-right">{count}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Reviews ({reviewCount})
          </h2>
          {avgRating !== null && avgRating !== undefined && reviewCount > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <StarRating rating={avgRating} size="md" />
              <span className="text-lg font-semibold text-gray-900">
                {avgRating.toFixed(1)}
              </span>
              <span className="text-gray-500">out of 5</span>
            </div>
          )}
        </div>

        {isAuthenticated && !isAuthor && !hasReviewed && !showReviewForm && (
          <Button onClick={() => setShowReviewForm(true)}>
            Write a Review
          </Button>
        )}
      </div>

      {data?.ratingDistribution && reviewCount > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          {[5, 4, 3, 2, 1].map((stars) =>
            renderRatingBar(stars, data.ratingDistribution[stars] || 0, reviewCount)
          )}
        </div>
      )}

      {showReviewForm && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Write Your Review</h3>
          <ReviewForm
            storyId={storyId}
            onSuccess={() => setShowReviewForm(false)}
            onCancel={() => setShowReviewForm(false)}
          />
        </div>
      )}

      {hasReviewed && (
        <div className="bg-sky-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Your Review</h3>
          <ReviewItem
            review={myReview}
            storyId={storyId}
            storyAuthorId={storyAuthorId}
          />
        </div>
      )}

      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-sky-500 border-t-transparent rounded-full mx-auto"></div>
        </div>
      )}

      {data && data.reviews.length > 0 && (
        <div className="space-y-4">
          {data.reviews
            .filter((r: any) => r.author.id !== user?.id) // Don't show user's review twice
            .map((review: any) => (
              <ReviewItem
                key={review.id}
                review={review}
                storyId={storyId}
                storyAuthorId={storyAuthorId}
              />
            ))}
        </div>
      )}

      {data && data.reviews.length === 0 && !hasReviewed && (
        <div className="text-center py-8 text-gray-500">
          No reviews yet. Be the first to review this story!
        </div>
      )}

      {data && data.pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm text-gray-600">
            Page {page} of {data.pagination.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page >= data.pagination.totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
