'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui';
import { CommentForm } from './comment-form';
import { CommentItem } from './comment-item';

interface CommentListProps {
  storyId?: string;
  chapterId?: string;
  storyAuthorId?: string;
}

export function CommentList({ storyId, chapterId, storyAuthorId }: CommentListProps) {
  const queryClient = useQueryClient();
  const { token } = useAuthStore();
  const [page, setPage] = useState(1);

  const queryKey = storyId
    ? ['comments', 'story', storyId, page]
    : ['comments', 'chapter', chapterId, page];

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => storyId
      ? api.getStoryComments(storyId, page)
      : api.getChapterComments(chapterId!, page),
  });

  const createMutation = useMutation({
    mutationFn: (data: { content: string; parentId?: string }) =>
      api.createComment(
        { content: data.content, storyId, chapterId, parentId: data.parentId },
        token!
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey.slice(0, 3) });
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      api.updateComment(id, content, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey.slice(0, 3) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteComment(id, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey.slice(0, 3) });
    },
  });

  const handleSubmit = async (content: string) => {
    await createMutation.mutateAsync({ content });
  };

  const handleReply = async (parentId: string, content: string) => {
    await createMutation.mutateAsync({ content, parentId });
  };

  const handleEdit = async (id: string, content: string) => {
    await editMutation.mutateAsync({ id, content });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this comment?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Comments {data?.pagination.total ? `(${data.pagination.total})` : ''}
      </h3>

      <div className="mb-6">
        <CommentForm onSubmit={handleSubmit} />
      </div>

      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin h-6 w-6 border-2 border-sky-500 border-t-transparent rounded-full mx-auto"></div>
        </div>
      )}

      {error && (
        <div className="text-center py-8 text-red-600">
          Failed to load comments
        </div>
      )}

      {data && (
        <>
          {data.comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {data.comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  onReply={handleReply}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  storyAuthorId={storyAuthorId}
                />
              ))}
            </div>
          )}

          {data.pagination.totalPages > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <span className="flex items-center px-3 text-sm text-gray-600">
                {page} / {data.pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
