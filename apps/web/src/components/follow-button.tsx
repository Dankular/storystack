'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui';

interface FollowButtonProps {
  userId: string;
  initialFollowing?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function FollowButton({ userId, initialFollowing, size = 'sm' }: FollowButtonProps) {
  const queryClient = useQueryClient();
  const { token, user, isAuthenticated } = useAuthStore();
  const [optimisticFollowing, setOptimisticFollowing] = useState<boolean | null>(null);

  const { data } = useQuery({
    queryKey: ['isFollowing', userId],
    queryFn: () => api.isFollowingUser(userId, token!),
    enabled: isAuthenticated && !!token,
    initialData: initialFollowing !== undefined ? { isFollowing: initialFollowing } : undefined,
  });

  const followMutation = useMutation({
    mutationFn: () => api.followUser(userId, token!),
    onMutate: () => setOptimisticFollowing(true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['isFollowing', userId] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: () => setOptimisticFollowing(null),
  });

  const unfollowMutation = useMutation({
    mutationFn: () => api.unfollowUser(userId, token!),
    onMutate: () => setOptimisticFollowing(false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['isFollowing', userId] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: () => setOptimisticFollowing(null),
  });

  // Don't show follow button for own profile
  if (user?.id === userId) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <Button size={size} variant="outline" onClick={() => window.location.href = '/login'}>
        Follow
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
      variant={isFollowing ? 'outline' : 'primary'}
      onClick={handleClick}
      disabled={isLoading}
    >
      {isFollowing ? 'Following' : 'Follow'}
    </Button>
  );
}
