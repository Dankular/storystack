'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui';

interface StoryFollowButtonProps {
  storyId: string;
  size?: 'sm' | 'md' | 'lg';
}

export function StoryFollowButton({ storyId, size = 'sm' }: StoryFollowButtonProps) {
  const queryClient = useQueryClient();
  const { token, isAuthenticated } = useAuthStore();
  const [optimisticFollowing, setOptimisticFollowing] = useState<boolean | null>(null);

  const { data } = useQuery({
    queryKey: ['isFollowingStory', storyId],
    queryFn: () => api.isFollowingStory(storyId, token!),
    enabled: isAuthenticated && !!token,
  });

  const followMutation = useMutation({
    mutationFn: () => api.followStory(storyId, token!),
    onMutate: () => setOptimisticFollowing(true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['isFollowingStory', storyId] });
    },
    onError: () => setOptimisticFollowing(null),
  });

  const unfollowMutation = useMutation({
    mutationFn: () => api.unfollowStory(storyId, token!),
    onMutate: () => setOptimisticFollowing(false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['isFollowingStory', storyId] });
    },
    onError: () => setOptimisticFollowing(null),
  });

  if (!isAuthenticated) {
    return (
      <Button size={size} variant="outline" onClick={() => window.location.href = '/login'}>
        Follow Story
      </Button>
    );
  }

  const isFollowing = optimisticFollowing ?? data?.isFollowing ?? false;
  const isLoading = followMutation.isPending || unfollowMutation.isPending;

  const handleClick = () => {
    if (isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  return (
    <Button
      size={size}
      variant={isFollowing ? 'secondary' : 'outline'}
      onClick={handleClick}
      disabled={isLoading}
    >
      {isFollowing ? 'Following' : 'Follow Story'}
    </Button>
  );
}
