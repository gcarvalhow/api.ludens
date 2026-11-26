'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Form } from '@components/ui/form';
import { Button } from '@components/ui/button';
import { AccountTextField } from '@account/components/forms/AccountTextField';
import { emailChangeSchema } from '@account/schemas/auth.schema';
import type { EmailChangeFormValues } from '@account/server/types/auth.types';
import { useAccountMutations } from '@account/hooks/mutations/useAccountMutations';
import { accountErrorMessage } from '@account/lib/errors';

export function EmailChangeFormContainer() {
  const form = useForm<EmailChangeFormValues>({ resolver: zodResolver(emailChangeSchema), defaultValues: { new_email: '', confirm_email: '' } });
  const { email } = useAccountMutations();
  const [message, setMessage] = useState('');
  const onSubmit = form.handleSubmit(async (values) => {
    setMessage('');
    form.clearErrors('root');
    try {
      const response = await email.mutateAsync({ new_email: values.new_email });
      setMessage(`${response.message} O link vale por 1 hora; uma nova solicitação invalida a anterior.`);
      form.reset();
    } catch (error) {
      form.setError('root', { message: accountErrorMessage(error, 'Não foi possível solicitar a troca de e-mail. Tente novamente.') });
    }
  });
  return <Form {...form}>
    <form onSubmit={onSubmit} className="space-y-4" aria-label="Trocar e-mail">
      <p className="text-sm text-muted-foreground">O link será enviado ao e-mail atual. A troca só acontece após sua confirmação e encerra todas as sessões.</p>
      <AccountTextField name="new_email" label="Novo e-mail" type="email" autoComplete="email" maxLength={254} disabled={email.isPending} />
      <AccountTextField name="confirm_email" label="Confirme o novo e-mail" type="email" autoComplete="off" maxLength={254} disabled={email.isPending} />
      {form.formState.errors.root ? <p role="alert">{form.formState.errors.root.message}</p> : null}
      {message ? <p role="status">{message}</p> : null}
      <Button type="submit" className="min-h-11" disabled={email.isPending}>{email.isPending ? 'Solicitando...' : 'Solicitar troca de e-mail'}</Button>
    </form>
  </Form>;
}
