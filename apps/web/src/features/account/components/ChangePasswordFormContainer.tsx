'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Form } from '@components/ui/form';
import { Button } from '@components/ui/button';
import { AccountTextField } from '@account/components/forms/AccountTextField';
import { changePasswordSchema } from '@account/schemas/auth.schema';
import type { ChangePasswordRequest } from '@account/server/types/auth.types';
import { authService } from '@account/services/auth.service';
import { useAuth } from '@account/contexts/AuthContext';
import { accountErrorMessage } from '@account/lib/errors';

export function ChangePasswordFormContainer() {
  const form = useForm<ChangePasswordRequest>({
    resolver: zodResolver(changePasswordSchema), defaultValues: { current_password: '', new_password: '' },
  });
  const mutation = useMutation({ mutationFn: authService.changePassword });
  const { clearSession } = useAuth();
  const router = useRouter();
  const onSubmit = form.handleSubmit(async (values) => {
    form.clearErrors('root');
    try {
      await mutation.mutateAsync(values);
      clearSession('/login?reason=password-changed&returnTo=%2Fminha-conta');
      router.replace('/login?reason=password-changed&returnTo=%2Fminha-conta');
    } catch (error) {
      form.setError('root', { message: accountErrorMessage(error, 'Não foi possível alterar a senha. Tente novamente.') });
    }
  });
  return <Form {...form}>
    <form onSubmit={onSubmit} className="space-y-4" aria-label="Alterar senha">
      <p id="efeito-senha" className="text-sm text-muted-foreground">Alterar a senha encerra todas as sessões, inclusive esta. Você precisará entrar novamente com a nova senha.</p>
      <AccountTextField name="current_password" label="Senha atual" type="password" autoComplete="current-password" disabled={mutation.isPending} />
      <AccountTextField name="new_password" label="Nova senha" type="password" autoComplete="new-password" disabled={mutation.isPending} />
      {form.formState.errors.root ? <p role="alert">{form.formState.errors.root.message}</p> : null}
      <Button type="submit" className="min-h-11" disabled={mutation.isPending} aria-describedby="efeito-senha">{mutation.isPending ? 'Alterando...' : 'Alterar senha'}</Button>
    </form>
  </Form>;
}
