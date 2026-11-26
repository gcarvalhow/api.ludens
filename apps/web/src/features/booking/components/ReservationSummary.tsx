'use client';

import { useEffect, useRef, useState } from 'react';
import { Badge } from '@components/ui/badge';
import { Card, CardContent } from '@components/ui/card';
import { formatPriceBRL } from '@catalog/lib';
import type { Reservation } from '@booking/server/types/reservation.types';
import { RebookingOptions } from './RebookingOptions';

const labels: Record<Reservation['status'], string> = {
  open: 'Aberta',
  confirmed: 'Confirmada',
  expired: 'Expirada',
  cancelled: 'Cancelada',
};

export function remainingSeconds(
  expiresAt: string,
  serverNow: string,
  receivedAt: number,
  clientNow: number,
) {
  return Math.max(
    0,
    Math.ceil(
      (Date.parse(expiresAt) - Date.parse(serverNow) - Math.max(0, clientNow - receivedAt)) / 1000,
    ),
  );
}

export function ReservationSummary({
  reservation,
  receivedAt,
  onExpire,
  children,
}: {
  reservation: Reservation;
  receivedAt: number;
  onExpire?: () => void;
  children?: React.ReactNode;
}) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const remaining = remainingSeconds(
    reservation.expires_at,
    reservation.server_now,
    receivedAt,
    now,
  );
  const expiryRequested = useRef(false);
  useEffect(() => {
    if (reservation.status === 'open' && remaining === 0 && !expiryRequested.current) {
      expiryRequested.current = true;
      onExpire?.();
    }
  }, [remaining, reservation.status, onExpire]);
  const deadline = new Date(reservation.expires_at).toLocaleString('pt-BR');
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-6">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl font-semibold">{reservation.show_title}</h2>
          <Badge variant={reservation.status === 'open' ? 'success' : 'secondary'}>
            {labels[reservation.status]}
          </Badge>
        </div>
        <p>
          {new Date(reservation.starts_at).toLocaleString('pt-BR')} · {reservation.venue}
        </p>
        <p className="break-all text-xs text-muted-foreground">Reserva {reservation.id}</p>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt>
            {reservation.full_quantity} inteira(s) ×{' '}
            {formatPriceBRL(reservation.full_price_cents / 100)}
          </dt>
          <dd className="text-right">
            {formatPriceBRL((reservation.full_quantity * reservation.full_price_cents) / 100)}
          </dd>
          <dt>
            {reservation.half_quantity} meia(s) ×{' '}
            {formatPriceBRL(reservation.half_price_cents / 100)}
          </dt>
          <dd className="text-right">
            {formatPriceBRL((reservation.half_quantity * reservation.half_price_cents) / 100)}
          </dd>
          <dt className="font-semibold">Total</dt>
          <dd className="text-right font-semibold">
            {formatPriceBRL(reservation.total_cents / 100)}
          </dd>
        </dl>
        {reservation.status === 'open' ? (
          <div className="rounded-md bg-muted p-3" role="timer" aria-label="Prazo restante">
            {remaining > 0
              ? `Tempo restante: ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`
              : 'Confirmando expiração da reserva...'}
            <p className="text-xs text-muted-foreground">
              Válida até {deadline}. Sem confirmação, os ingressos voltam à sessão.
            </p>
          </div>
        ) : null}
        {reservation.status === 'expired' ? (
          <p role="status">A reserva expirou. Os ingressos voltaram para a sessão.</p>
        ) : null}
        {reservation.status === 'cancelled' ? (
          <p role="status">Reserva cancelada. Os ingressos foram liberados.</p>
        ) : null}
        {children}
        {reservation.status === 'expired' ||
        reservation.status === 'cancelled' ||
        Date.parse(reservation.starts_at) <=
          Date.parse(reservation.server_now) + Math.max(0, now - receivedAt) ? (
          <RebookingOptions reservationId={reservation.id} />
        ) : null}
      </CardContent>
    </Card>
  );
}
