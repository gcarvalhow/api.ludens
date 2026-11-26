'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import { Button } from '@components/ui/button';
import { Label } from '@components/ui/label';
import { useRebookingOptions } from '@booking/hooks/useReservations';

export function RebookingOptions({ reservationId }: { reservationId: string }) {
  const query = useRebookingOptions(reservationId);
  const [selectedId, setSelectedId] = useState('');
  const selectId = useId();
  const serverNow = query.data
    ? Date.parse(query.data.server_now) + Math.max(0, Date.now() - query.dataUpdatedAt)
    : Date.now();
  const sessions = (query.data?.sessions ?? []).filter(
    (session) => session.available_count > 0 && Date.parse(session.starts_at) > serverNow,
  );
  const selected = sessions.find((session) => session.id === selectedId) ?? sessions[0];

  if (query.isPending) {
    return (
      <Button variant="outline" disabled>
        Buscando próximas sessões...
      </Button>
    );
  }
  if (query.isError) {
    return (
      <div className="flex flex-col gap-2" role="alert">
        <p className="text-sm">Não foi possível consultar as próximas sessões.</p>
        <Button variant="outline" onClick={() => void query.refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }
  if (!selected) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          Não há outras sessões futuras com vagas para este espetáculo.
        </p>
        <Button variant="outline" disabled>
          Reservar novamente
        </Button>
      </div>
    );
  }
  const formatSession = (session: typeof selected) =>
    `${new Date(session.starts_at).toLocaleString('pt-BR')} · ${session.venue} · ${session.available_count} vaga(s)`;
  return (
    <div className="flex flex-col gap-3">
      {sessions.length > 1 ? (
        <>
          <Label htmlFor={selectId}>Escolher sessão</Label>
          <select
            id={selectId}
            value={selected.id}
            onChange={(event) => setSelectedId(event.target.value)}
            className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {sessions.map((session, index) => (
              <option key={session.id} value={session.id}>
                {formatSession(session)}
                {index === 0 ? ' — Mais próxima' : ''}
              </option>
            ))}
          </select>
        </>
      ) : (
        <p className="text-sm">Próxima sessão: {formatSession(selected)}</p>
      )}
      <Button variant="outline" asChild>
        <Link href={`/sessoes/${selected.id}`}>Reservar novamente</Link>
      </Button>
    </div>
  );
}
