'use client';

import { useState } from 'react';
import { Button } from '@components/ui/button';
import { useAccountMutations } from '@account/hooks/mutations/useAccountMutations';
import { accountErrorMessage } from '@account/lib/errors';
import { AccountRetentionNotice } from '@account/components/AccountRetentionNotice';

export function AccountDeletionFormContainer() {
  const { deletion } = useAccountMutations();
  const [accepted, setAccepted] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  async function requestDeletion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accepted || deletion.isPending) return;
    setError('');
    setMessage('');
    try {
      const response = await deletion.mutateAsync();
      setMessage(`${response.message} Sua conta continua ativa até a confirmação. O link vale por 1 hora.`);
    } catch (cause) {
      setError(accountErrorMessage(cause, 'Não foi possível solicitar a exclusão. Tente novamente.'));
    }
  }
  return <form onSubmit={(event) => void requestDeletion(event)} className="space-y-4" aria-label="Excluir conta">
    <AccountRetentionNotice />
    <label className="flex min-h-11 items-start gap-3">
      <input type="checkbox" className="mt-1 size-5 shrink-0" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} aria-describedby="preservacao-historico" disabled={deletion.isPending} />
      <span>Entendi o encerramento do acesso e a preservação do histórico.</span>
    </label>
    {message ? <p role="status">{message}</p> : null}
    {error ? <p role="alert">{error}</p> : null}
    <Button type="submit" variant="destructive" className="min-h-11" disabled={!accepted || deletion.isPending}>{deletion.isPending ? 'Solicitando...' : 'Solicitar exclusão da conta'}</Button>
  </form>;
}
