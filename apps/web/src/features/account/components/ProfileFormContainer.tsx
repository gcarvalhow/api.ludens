'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Form } from '@components/ui/form';
import { Button } from '@components/ui/button';
import { AccountTextField } from '@account/components/forms/AccountTextField';
import { updateProfileSchema } from '@account/schemas/auth.schema';
import type { UpdateProfileRequest, User } from '@account/server/types/auth.types';
import { useAccountMutations } from '@account/hooks/mutations/useAccountMutations';
import { accountErrorMessage } from '@account/lib/errors';

export function ProfileFormContainer({ user }: { user: User }) {
  const form = useForm<UpdateProfileRequest>({ resolver: zodResolver(updateProfileSchema), defaultValues: { name: user.name } });
  const { profile } = useAccountMutations();
  const [message, setMessage] = useState('');
  const onSubmit = form.handleSubmit(async (values) => {
    setMessage('');
    form.clearErrors('root');
    try {
      const updated = await profile.mutateAsync(values);
      form.reset({ name: updated.name });
      setMessage('Perfil atualizado.');
    } catch (error) {
      form.setError('root', { message: accountErrorMessage(error, 'Não foi possível salvar o perfil. Tente novamente.') });
    }
  });
  return <Form {...form}>
    <form onSubmit={onSubmit} className="space-y-4" aria-label="Editar perfil">
      <AccountTextField name="name" label="Nome" autoComplete="name" maxLength={120} disabled={profile.isPending} />
      <p className="break-all text-sm">E-mail atual: {user.email}</p>
      <p className="text-sm text-muted-foreground">O CPF informado no cadastro não pode ser alterado nesta área.</p>
      {form.formState.errors.root ? <p role="alert">{form.formState.errors.root.message}</p> : null}
      {message ? <p role="status">{message}</p> : null}
      <Button type="submit" className="min-h-11" disabled={profile.isPending}>{profile.isPending ? 'Salvando...' : 'Salvar perfil'}</Button>
    </form>
  </Form>;
}
