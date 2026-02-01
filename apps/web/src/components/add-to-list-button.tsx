'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui';

interface AddToListButtonProps {
  storyId: string;
  size?: 'sm' | 'md' | 'lg';
}

export function AddToListButton({ storyId, size = 'sm' }: AddToListButtonProps) {
  const queryClient = useQueryClient();
  const { token, isAuthenticated } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: lists } = useQuery({
    queryKey: ['reading-lists'],
    queryFn: () => api.getMyReadingLists(token!),
    enabled: isAuthenticated && !!token && isOpen,
  });

  const addMutation = useMutation({
    mutationFn: (listId: string) => api.addToReadingList(listId, storyId, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reading-lists'] });
      setIsOpen(false);
    },
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isAuthenticated) {
    return (
      <Button
        size={size}
        variant="outline"
        onClick={() => window.location.href = '/login'}
      >
        + Add to List
      </Button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        size={size}
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
      >
        + Add to List
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-2">
            {!lists || lists.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 text-center">
                No reading lists yet.{' '}
                <a href="/library" className="text-sky-600 hover:text-sky-700">
                  Create one
                </a>
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto">
                {lists.map((list: any) => (
                  <button
                    key={list.id}
                    onClick={() => addMutation.mutate(list.id)}
                    disabled={addMutation.isPending}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded disabled:opacity-50"
                  >
                    {list.name}
                    <span className="text-gray-400 ml-2">
                      ({list._count?.items || 0})
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="border-t border-gray-200 p-2">
            <a
              href="/library"
              className="block text-center text-sm text-sky-600 hover:text-sky-700 py-1"
            >
              Manage Lists
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
