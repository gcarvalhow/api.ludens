'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@account/contexts/AuthContext';
import { useCurrentUser } from '@account/hooks/queries/useAccountQueries';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { formatPriceBRL } from '@catalog/lib';
import { apiErrorMessage } from '@catalog/lib/errors';
import type { SessionDetail } from '@catalog/server/types';
import { useTicketSelection } from '@booking/hooks/useTicketSelection';
import { useReservationMutations } from '@booking/hooks/useReservations';
import { selectionSchema } from '@booking/schemas/reservation.schema';

export function TicketPicker({ session }: { session: SessionDetail }) {
  const router = useRouter();
  const auth = useAuth();
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const { selection, update, persist, clear } = useTicketSelection(session.id);
  const { create } = useReservationMutations();
  const submitting = useRef(false);
  const [error, setError] = useState('');
  const fullPrice = Math.round(
    (session.ticket_types.find((t) => t.type === 'full')?.price ?? 0) * 100,
  );
  const halfPrice = Math.round(
    (session.ticket_types.find((t) => t.type === 'half')?.price ?? 0) * 100,
  );
  const quantity = (selection?.full_quantity ?? 0) + (selection?.half_quantity ?? 0);
  const available = session.status === 'on_sale' && quantity <= session.available_count;
  const valid = selectionSchema.safeParse(selection).success;

  const reserve = async () => {
    if (!selection || !valid || !available || submitting.current) return;
    persist(selection);
    if (!auth.isAuthenticated) {
      router.push(`/login?returnTo=${encodeURIComponent(`/sessoes/${session.id}`)}`);
      return;
    }
    submitting.current = true;
    setError('');
    try {
      const reservation = await create.mutateAsync({ ...selection, session_id: session.id });
      clear();
      router.push(`/checkout/${reservation.id}`);
    } catch (cause) {
      setError(
        apiErrorMessage(cause, 'Não foi possível reservar. Tente novamente com a mesma seleção.'),
      );
    } finally {
      submitting.current = false;
    }
  };

  if (user?.is_admin)
    return (
      <p className="text-sm text-muted-foreground">
        Reservas estão disponíveis na área do comprador.
      </p>
    );

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void reserve();
      }}
    >
      <h2 className="font-semibold">Selecione seus ingressos</h2>
      {(['full', 'half'] as const).map((type) => {
        const field = type === 'full' ? 'full_quantity' : 'half_quantity';
        const label = type === 'full' ? 'Inteira' : 'Meia-entrada';
        const price = type === 'full' ? fullPrice : halfPrice;
        return (
          <div key={type} className="flex flex-wrap items-center justify-between gap-3">
            <Label htmlFor={`quantity-${type}`} className="flex-1">
              {label} — {formatPriceBRL(price / 100)}
            </Label>
            <Input
              id={`quantity-${type}`}
              type="number"
              inputMode="numeric"
              min={0}
              max={6}
              step={1}
              className="w-20"
              value={selection?.[field] ?? 0}
              disabled={!selection || create.isPending || session.status !== 'on_sale'}
              onChange={(event) => {
                setError('');
                update(field, Number(event.target.value));
              }}
            />
            <span className="w-24 text-right text-sm" aria-label={`Subtotal ${label}`}>
              {formatPriceBRL(((selection?.[field] ?? 0) * price) / 100)}
            </span>
          </div>
        );
      })}
      <p className="flex justify-between font-semibold" aria-live="polite">
        <span>Total ({quantity} ingressos)</span>
        <span>
          {formatPriceBRL(
            ((selection?.full_quantity ?? 0) * fullPrice +
              (selection?.half_quantity ?? 0) * halfPrice) /
              100,
          )}
        </span>
      </p>
      <p className="text-sm text-muted-foreground">
        Limite de 6 ingressos por CPF nesta sessão, incluindo reservas abertas e compras
        confirmadas. O prazo da reserva será informado após a confirmação.
      </p>
      {!valid && selection ? (
        <p role="alert" className="text-sm text-destructive">
          Selecione de 1 a 6 ingressos.
        </p>
      ) : null}
      {valid && !available ? (
        <p role="alert" className="text-sm text-destructive">
          A sessão está indisponível ou não há ingressos suficientes para esta seleção.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        className="min-h-11 w-full"
        disabled={
          !selection ||
          !valid ||
          !available ||
          auth.isLoading ||
          (auth.isAuthenticated && userLoading) ||
          create.isPending
        }
      >
        {create.isPending ? 'Reservando...' : 'Reservar'}
      </Button>
    </form>
  );
}
