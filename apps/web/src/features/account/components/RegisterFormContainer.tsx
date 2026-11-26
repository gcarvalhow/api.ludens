'use client';

import { useRouter } from 'next/navigation';

import { RegisterForm } from '@account/components/forms';
import { useRegisterForm } from '@account/hooks/forms';
import { useAuthMutations } from '@account/hooks/mutations';
import { safeReturnTo } from '@account/lib/navigation';
import Link from 'next/link';

export function RegisterFormContainer({ returnTo = '/' }: { returnTo?: string }) {
  const router = useRouter();

  const form = useRegisterForm();
  const { registerMutation } = useAuthMutations();

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      await registerMutation.mutateAsync(data);

      router.replace(safeReturnTo(returnTo));
    } catch {
      // O toast de erro já é tratado na mutation.
    }
  });

  return <>
    <RegisterForm form={form} onSubmit={onSubmit} isPending={registerMutation.isPending} />
    <Link className="mt-4 block text-center underline" href={`/login?returnTo=${encodeURIComponent(safeReturnTo(returnTo))}`}>Já tenho uma conta</Link>
  </>;
}
