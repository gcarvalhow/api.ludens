'use client';

import { ForgotPasswordForm } from '@account/components/forms';
import { useForgotPasswordForm } from '@account/hooks/forms';
import { useAuthMutations } from '@account/hooks/mutations';

export function ForgotPasswordFormContainer() {
  const form = useForgotPasswordForm();
  const { forgotPasswordMutation } = useAuthMutations();

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      await forgotPasswordMutation.mutateAsync(data);
    } catch {
      // O toast de erro já é tratado na mutation.
    }
  });

  return (
    <ForgotPasswordForm
      form={form}
      onSubmit={onSubmit}
      isPending={forgotPasswordMutation.isPending}
    />
  );
}
