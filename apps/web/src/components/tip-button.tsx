'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui';
import { TipModal } from './tip-modal';

interface TipButtonProps {
  authorId: string;
  authorName: string;
  storyId?: string;
  storyTitle?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function TipButton({ authorId, authorName, storyId, storyTitle, size = 'sm' }: TipButtonProps) {
  const { user, isAuthenticated } = useAuthStore();
  const [showModal, setShowModal] = useState(false);

  const { data: tipStatus } = useQuery({
    queryKey: ['tip-status', authorId],
    queryFn: () => api.canAuthorReceiveTips(authorId),
    staleTime: 60000, // Cache for 1 minute
  });

  // Don't show if author doesn't accept tips
  if (!tipStatus?.canReceiveTips) {
    return null;
  }

  // Don't show tip button for own profile
  if (user?.id === authorId) {
    return null;
  }

  const handleClick = () => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }
    setShowModal(true);
  };

  return (
    <>
      <Button
        variant="outline"
        size={size}
        onClick={handleClick}
        className="gap-1"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Tip
      </Button>

      {showModal && (
        <TipModal
          authorId={authorId}
          authorName={authorName}
          minimumAmount={tipStatus?.minimumTipAmount || 100}
          storyId={storyId}
          storyTitle={storyTitle}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
