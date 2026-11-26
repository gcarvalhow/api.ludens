'use client';

import { useState } from 'react';
import Link from 'next/link';
import { RequireAuth } from '@account/components/RequireAuth';
import { Button } from '@components/ui/button';
import { useMyReservations } from '@booking/hooks/useReservations';
import { ReservationSummary } from './ReservationSummary';

function ReservationList() {
  const [page, setPage] = useState(1);
  const query = useMyReservations(page);
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 pb-8 pt-20">
      <Link href="/" className="text-sm text-primary underline">
        Voltar ao catálogo
      </Link>
      <h1 className="text-2xl font-semibold">Minhas reservas</h1>
      {query.isPending ? <p role="status">Carregando reservas...</p> : null}
      {query.isError ? (
        <div role="alert">
          <p>Não foi possível atualizar suas reservas.</p>
          <Button variant="outline" onClick={() => void query.refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : null}
      {query.data?.items.length === 0 ? (
        <p>Nenhuma reserva encontrada. Escolha uma sessão no catálogo para começar.</p>
      ) : null}
      {query.data?.items.map((reservation) => (
        <ReservationSummary
          key={reservation.id}
          reservation={reservation}
          receivedAt={query.dataUpdatedAt}
          onExpire={() => void query.refetch()}
        >
          <Button asChild>
            <Link href={`/checkout/${reservation.id}`}>
              Ver detalhes{reservation.status === 'open' ? ' e cancelar' : ''}
            </Link>
          </Button>
        </ReservationSummary>
      ))}
      {query.data && query.data.total > 12 ? (
        <nav aria-label="Paginação de reservas" className="flex items-center justify-between">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </Button>
          <span>Página {page}</span>
          <Button
            variant="outline"
            disabled={page * 12 >= query.data.total}
            onClick={() => setPage((p) => p + 1)}
          >
            Próxima
          </Button>
        </nav>
      ) : null}
    </main>
  );
}

export function MyReservations() {
  return (
    <RequireAuth>
      <ReservationList />
    </RequireAuth>
  );
}
