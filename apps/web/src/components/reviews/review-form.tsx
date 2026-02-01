'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { Button, Input } from '@/components/ui';
import { StarRating } from './star-rating';

interface ReviewFormProps {
  storyId: string;
  existingReview?: {
    id: string;
    rating: number;
    title?: string;
    content: string;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReviewForm({ storyId, existingReview, onSuccess, onCancel }: ReviewFormProps) {
  const queryClient = useQueryClient();
  const { token, isAuthenticated } = useAuthStore();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [title, setTitle] = useState(existingReview?.title || '');
  const [content, setContent] = useState(existingReview?.content || '');
  const [error, setError] = useState('');

  const createMutation = useMutation({
    mutationFn: () => api.createReview({ storyId, rating, title: title || undefined, content }, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', storyId] });
      queryClient.invalidateQueries({ queryKey: ['my-review', storyId] });
      queryClient.invalidateQueries({ queryKey: ['story', storyId] });
      setRating(0);
      setTitle('');
      setContent('');
      onSuccess?.();
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to submit review');
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => api.updateReview(existingReview!.id, { rating, title: title || undefined, content }, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', storyId] });
      queryClient.invalidateQueries({ queryKey: ['my-review', storyId] });
      queryClient.invalidateQueries({ queryKey: ['story', storyId] });
      onSuccess?.();
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to update review');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (content.length < 10) {
      setError('Review must be at least 10 characters');
      return;
    }

    if (existingReview) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 text-center">
        <p className="text-gray-600">
          <a href="/login" className="text-sky-600 hover:text-sky-700 font-medium">
            Log in
          </a>{' '}
          to write a review
        </p>
      </div>
    );
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Rating
        </label>
        <StarRating
          rating={rating}
          size="lg"
          interactive
          onChange={setRating}
        />
      </div>

      <div>
        <label htmlFor="review-title" className="block text-sm font-medium text-gray-700 mb-1">
          Review Title (Optional)
        </label>
        <Input
          id="review-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarize your review"
          maxLength={200}
        />
      </div>

      <div>
        <label htmlFor="review-content" className="block text-sm font-medium text-gray-700 mb-1">
          Your Review
        </label>
        <textarea
          id="review-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your thoughts about this story..."
          rows={4}
          maxLength={5000}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
        />
        <p className="text-xs text-gray-500 mt-1">{content.length}/5000 characters</p>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Submitting...' : existingReview ? 'Update Review' : 'Submit Review'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
