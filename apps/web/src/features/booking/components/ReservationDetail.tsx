'use client';

import { useState } from 'react';
import Link from 'next/link';
import { RequireAuth } from '@account/components/RequireAuth';
import { Button } from '@components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@components/ui/alert-dialog';
import { apiErrorMessage, apiErrorStatus } from '@catalog/lib/errors';
import { useReservation, useReservationMutations } from '@booking/hooks/useReservations';
import { ReservationSummary } from './ReservationSummary';

function Detail({ id }: { id: string }) {
  const query = useReservation(id);
  const { cancel } = useReservationMutations();
  const [error, setError] = useState('');
  const cancelReservation = async () => {
    setError('');
    try {
      await cancel.mutateAsync(id);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Não foi possível cancelar. Tente novamente.'));
    }
  };
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 pb-8 pt-20">
      <Link href="/minhas-reservas" className="text-sm text-primary underline">
        Minhas reservas
      </Link>
      <h1 className="text-2xl font-semibold">Detalhes da reserva</h1>
      {query.isPending ? <p role="status">Carregando reserva...</p> : null}
      {query.isError ? (
        <div role="alert">
          <p>
            {apiErrorStatus(query.error) === 404
              ? 'Reserva não encontrada.'
              : 'Não foi possível atualizar esta reserva.'}
          </p>
          <Button variant="outline" onClick={() => void query.refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : null}
      {query.data ? (
        <ReservationSummary
          reservation={query.data}
          receivedAt={query.dataUpdatedAt}
          onExpire={() => void query.refetch()}
        >
          {error ? (
            <p role="alert" className="text-destructive">
              {error}
            </p>
          ) : null}
          {query.data.status === 'open' ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={cancel.isPending}>
                  {cancel.isPending ? 'Cancelando...' : 'Cancelar reserva'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancelar esta reserva?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Seus ingressos serão liberados para outras pessoas. Esta ação não pode ser
                    desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Manter reserva</AlertDialogCancel>
                  <AlertDialogAction onClick={() => void cancelReservation()}>
                    Confirmar cancelamento
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
        </ReservationSummary>
      ) : null}
    </main>
  );
}

export function ReservationDetail({ id }: { id: string }) {
  return (
    <RequireAuth>
      <Detail id={id} />
    </RequireAuth>
  );
}
