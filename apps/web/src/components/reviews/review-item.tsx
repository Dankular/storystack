'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui';
import { StarRating } from './star-rating';
import { ReviewForm } from './review-form';

interface ReviewItemProps {
  review: {
    id: string;
    rating: number;
    title?: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    author: {
      id: string;
      username: string;
      displayName?: string;
      avatarUrl?: string;
    };
  };
  storyId: string;
  storyAuthorId: string;
}

export function ReviewItem({ review, storyId, storyAuthorId }: ReviewItemProps) {
  const queryClient = useQueryClient();
  const { token, user, isAuthenticated } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteReview(review.id, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', storyId] });
      queryClient.invalidateQueries({ queryKey: ['my-review', storyId] });
      queryClient.invalidateQueries({ queryKey: ['story', storyId] });
    },
  });

  const isOwner = user?.id === review.author.id;
  const isStoryAuthor = user?.id === storyAuthorId;
  const canDelete = isAuthenticated && (isOwner || isStoryAuthor);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isEditing) {
    return (
      <div className="border border-gray-200 rounded-lg p-4">
        <ReviewForm
          storyId={storyId}
          existingReview={{
            id: review.id,
            rating: review.rating,
            title: review.title,
            content: review.content,
          }}
          onSuccess={() => setIsEditing(false)}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        {review.author.avatarUrl ? (
          <img
            src={review.author.avatarUrl}
            alt={review.author.username}
            className="w-10 h-10 rounded-full"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center">
            <span className="text-sky-600 font-medium">
              {(review.author.displayName || review.author.username).charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/user/${review.author.username}`}
              className="font-medium text-gray-900 hover:text-sky-600"
            >
              {review.author.displayName || review.author.username}
            </Link>
            <StarRating rating={review.rating} size="sm" />
          </div>

          {review.title && (
            <h4 className="font-semibold text-gray-900 mt-1">{review.title}</h4>
          )}

          <p className="text-gray-700 mt-2 whitespace-pre-line">{review.content}</p>

          <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
            <span>{formatDate(review.createdAt)}</span>
            {review.updatedAt !== review.createdAt && (
              <span>(edited)</span>
            )}
          </div>

          {isAuthenticated && (isOwner || canDelete) && (
            <div className="mt-3 flex gap-2">
              {isOwner && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-sm text-sky-600 hover:text-sky-700"
                >
                  Edit
                </button>
              )}
              {canDelete && (
                <>
                  {showConfirmDelete ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Delete review?</span>
                      <button
                        onClick={() => deleteMutation.mutate()}
                        disabled={deleteMutation.isPending}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setShowConfirmDelete(false)}
                        className="text-sm text-gray-600 hover:text-gray-700"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowConfirmDelete(true)}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Delete
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
