'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '@account/services/auth.service';
import { useAuth } from '@account/contexts/AuthContext';
import { accountQueryKeys } from '@account/hooks/queries/query-options';

export function useAccountMutations() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const profile = useMutation({
    mutationFn: authService.updateProfile,
    onSuccess: (user) => {
      queryClient.setQueryData(accountQueryKeys.currentUser(userId ?? ''), user);
    },
  });
  const email = useMutation({ mutationFn: authService.requestEmailChange });
  const deletion = useMutation({ mutationFn: authService.requestAccountDeletion });
  return { profile, email, deletion };
}
