'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui';
import { CommentForm } from './comment-form';

interface CommentItemProps {
  comment: {
    id: string;
    content: string;
    createdAt: string;
    author: {
      id: string;
      username: string;
      displayName?: string;
      avatarUrl?: string;
    };
    replies?: any[];
    _count?: { replies: number };
  };
  onReply: (parentId: string, content: string) => Promise<void>;
  onEdit: (id: string, content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  storyAuthorId?: string;
}

export function CommentItem({
  comment,
  onReply,
  onEdit,
  onDelete,
  storyAuthorId,
}: CommentItemProps) {
  const { user } = useAuthStore();
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showReplies, setShowReplies] = useState(false);

  const isOwner = user?.id === comment.author.id;
  const canDelete = isOwner || user?.id === storyAuthorId;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleReply = async (content: string) => {
    await onReply(comment.id, content);
    setIsReplying(false);
    setShowReplies(true);
  };

  const handleEdit = async (content: string) => {
    await onEdit(comment.id, content);
    setIsEditing(false);
  };

  const replyCount = comment._count?.replies || comment.replies?.length || 0;

  return (
    <div className="py-4">
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          {comment.author.avatarUrl ? (
            <img
              src={comment.author.avatarUrl}
              alt={comment.author.username}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center">
              <span className="text-sky-600 text-sm font-medium">
                {(comment.author.displayName || comment.author.username).charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={`/user/${comment.author.username}`}
              className="font-medium text-gray-900 hover:text-sky-600"
            >
              {comment.author.displayName || comment.author.username}
            </Link>
            <span className="text-gray-400 text-sm">
              {formatDate(comment.createdAt)}
            </span>
          </div>

          {isEditing ? (
            <div className="mt-2">
              <CommentForm
                onSubmit={handleEdit}
                onCancel={() => setIsEditing(false)}
                placeholder="Edit your comment..."
                buttonText="Save"
                autoFocus
              />
            </div>
          ) : (
            <p className="mt-1 text-gray-700 whitespace-pre-line">{comment.content}</p>
          )}

          {!isEditing && (
            <div className="mt-2 flex items-center gap-4 text-sm">
              {user && (
                <button
                  onClick={() => setIsReplying(!isReplying)}
                  className="text-gray-500 hover:text-sky-600"
                >
                  Reply
                </button>
              )}
              {isOwner && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-gray-500 hover:text-sky-600"
                >
                  Edit
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => onDelete(comment.id)}
                  className="text-gray-500 hover:text-red-600"
                >
                  Delete
                </button>
              )}
            </div>
          )}

          {isReplying && (
            <div className="mt-3">
              <CommentForm
                onSubmit={handleReply}
                onCancel={() => setIsReplying(false)}
                placeholder="Write a reply..."
                buttonText="Reply"
                autoFocus
              />
            </div>
          )}

          {replyCount > 0 && !showReplies && (
            <button
              onClick={() => setShowReplies(true)}
              className="mt-2 text-sm text-sky-600 hover:text-sky-700"
            >
              Show {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
            </button>
          )}

          {showReplies && comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 pl-4 border-l-2 border-gray-100 space-y-4">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  storyAuthorId={storyAuthorId}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
