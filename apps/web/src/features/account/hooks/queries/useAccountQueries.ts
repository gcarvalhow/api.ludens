'use client';

import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@account/contexts/AuthContext';
import { accountQueryOptions } from './query-options';

export function useCurrentUser() {
  const { accessToken, userId } = useAuth();

  return useQuery({
    ...accountQueryOptions.currentUser(userId ?? ''),
    enabled: Boolean(accessToken && userId),
  });
}
