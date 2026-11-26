'use client';

import { useRouter } from 'next/navigation';

import { LoginForm } from '@account/components/forms';
import { useLoginForm } from '@account/hooks/forms';
import { useAuthMutations } from '@account/hooks/mutations';
import { safeReturnTo } from '@account/lib/navigation';

export function LoginFormContainer({ returnTo = '/' }: { returnTo?: string }) {
  const router = useRouter();

  const form = useLoginForm();
  const { loginMutation } = useAuthMutations();

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      await loginMutation.mutateAsync(data);

      router.replace(safeReturnTo(returnTo));
    } catch {
      // O toast de erro já é tratado na mutation.
    }
  });

  return <LoginForm form={form} onSubmit={onSubmit} isPending={loginMutation.isPending} returnTo={safeReturnTo(returnTo)} />;
}
