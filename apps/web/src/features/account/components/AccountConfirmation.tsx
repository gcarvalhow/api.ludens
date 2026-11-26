'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@components/ui/button';
import { authService } from '@account/services/auth.service';
import { useAuth } from '@account/contexts/AuthContext';
import { accountErrorMessage } from '@account/lib/errors';
import { AccountRetentionNotice } from './AccountRetentionNotice';

type AccountConfirmationProps = { kind: 'email' | 'deletion'; token: string };

export function AccountConfirmation({ kind, token }: AccountConfirmationProps) {
  return <ConfirmationFlow key={`${kind}:${token}`} kind={kind} token={token} />;
}

function ConfirmationFlow({ kind, token }: AccountConfirmationProps) {
  const { clearSession } = useAuth();
  const [accepted, setAccepted] = useState(false);
  const [done, setDone] = useState(false);
  const mutation = useMutation({
    mutationFn: () => kind === 'email' ? authService.confirmEmailChange(token) : authService.confirmAccountDeletion(token),
    onSuccess: () => { setDone(true); clearSession(); },
  });
  const invalid = !token.trim() || token.length > 512;
  const terminal = mutation.error instanceof Error && 'status' in mutation.error && mutation.error.status === 410;

  if (done) return <div className="space-y-4">
    <p role="status">{kind === 'email'
      ? 'E-mail alterado. Todas as sessões foram encerradas. Entre novamente com o novo e-mail.'
      : 'Conta encerrada. Todas as sessões foram encerradas e o vínculo com o histórico comercial foi preservado.'}</p>
    <Button asChild><Link href={kind === 'email' ? '/login' : '/'}>{kind === 'email' ? 'Entrar novamente' : 'Voltar ao catálogo'}</Link></Button>
  </div>;

  return <div className="space-y-4">
    {invalid ? <p role="alert">Link inválido ou incompleto. Solicite um novo link em Minha conta.</p> : <>
      {kind === 'deletion' ? <>
        <AccountRetentionNotice />
        <label className="flex min-h-11 items-start gap-3">
          <input type="checkbox" className="mt-1 size-5 shrink-0" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} disabled={mutation.isPending || terminal} aria-describedby="preservacao-historico" />
          <span>Quero encerrar a conta e entendi a preservação do histórico.</span>
        </label>
      </> : <p>A confirmação altera seu e-mail e encerra todas as sessões. Você precisará entrar novamente.</p>}
      {mutation.isError ? <p role="alert">{accountErrorMessage(mutation.error, 'Não foi possível confirmar. Verifique sua conexão e tente novamente.')}</p> : null}
      <Button className="min-h-11" variant={kind === 'deletion' ? 'destructive' : 'default'} disabled={mutation.isPending || terminal || (kind === 'deletion' && !accepted)} onClick={() => mutation.mutate()}>
        {mutation.isPending ? 'Confirmando...' : kind === 'email' ? 'Confirmar troca de e-mail' : 'Confirmar exclusão da conta'}
      </Button>
    </>}
    <Link href="/minha-conta" className="block min-h-11 content-center underline">Minha conta / solicitar novo link</Link>
  </div>;
}
