'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { ResetPasswordForm } from '@account/components/forms';
import { useResetPasswordForm } from '@account/hooks/forms';
import { useAuthMutations } from '@account/hooks/mutations';

export function ResetPasswordFormContainer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const form = useResetPasswordForm();
  const { resetPasswordMutation } = useAuthMutations();

  useEffect(() => {
    if (token) {
      form.setValue('token', token);
    }
  }, [token, form]);

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      await resetPasswordMutation.mutateAsync(data);

      router.push('/login');
    } catch {
      // O toast de erro já é tratado na mutation.
    }
  });

  return (
    <ResetPasswordForm
      form={form}
      onSubmit={onSubmit}
      isPending={resetPasswordMutation.isPending}
      hasToken={Boolean(token)}
    />
  );
}
