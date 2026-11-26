import { queryOptions } from '@tanstack/react-query';

import { authService } from '@account/services/auth.service';

export const accountQueryKeys = {
  all: ['account'] as const,
  currentUser: (userId: string) =>
    [...accountQueryKeys.all, 'currentUser', userId] as const,
};

export const accountQueryOptions = {
  currentUser: (userId: string) =>
    queryOptions({
      queryKey: accountQueryKeys.currentUser(userId),
      queryFn: () => authService.fetchUserById(userId),
    }),
};
