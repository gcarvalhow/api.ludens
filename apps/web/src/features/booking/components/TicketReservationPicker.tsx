'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { useAuth } from '@account/contexts/AuthContext';
import { loginUrl } from '@account/lib/navigation';
import { ApiError } from '@web/lib/fetcher';
import type { SessionDetail } from '@catalog/server/types';
import { purchaseService } from '@booking/services/purchase.service';

function errorMessage(error: unknown) {
  if (error instanceof ApiError) {
    const detail = (error.data as { detail?: unknown } | undefined)?.detail;
    if (typeof detail === 'string') return detail;
  }
  return 'Não foi possível criar sua reserva. Tente novamente.';
}

export function TicketReservationPicker({ session }: { session: SessionDetail }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [fullQuantity, setFullQuantity] = useState(0);
  const [halfQuantity, setHalfQuantity] = useState(0);
  const create = useMutation({
    mutationFn: purchaseService.createReservation,
    onSuccess: (reservation) => router.push(`/checkout/${reservation.id}`),
    onError: (error) => toast.error(errorMessage(error)),
  });
  const quantity = fullQuantity + halfQuantity;
  const fullPrice = session.ticket_types.find((ticket) => ticket.type === 'full')?.price ?? 0;
  const halfPrice = session.ticket_types.find((ticket) => ticket.type === 'half')?.price ?? 0;
  const total = fullQuantity * fullPrice + halfQuantity * halfPrice;
  const canReserve = session.status === 'on_sale' && quantity > 0 && quantity <= 6 && quantity <= session.available_count;

  function reserve() {
    if (!isAuthenticated) {
      const destination = `${window.location.pathname}${window.location.search}`;
      router.push(loginUrl(destination));
      return;
    }
    create.mutate({
      session_id: session.id,
      idempotency_key: crypto.randomUUID(),
      full_quantity: fullQuantity,
      half_quantity: halfQuantity,
    });
  }

  return (
    <section className="space-y-4" aria-label="Selecionar ingressos">
      <div className="grid grid-cols-[1fr_6rem] items-center gap-3">
        <label htmlFor="ingressos-inteira" className="text-sm font-medium">Inteira · R$ {fullPrice.toFixed(2)}</label>
        <Input id="ingressos-inteira" type="number" min={0} max={Math.min(6, session.available_count)} step={1} value={fullQuantity}
          onChange={(event) => setFullQuantity(Math.max(0, Math.min(6, Number.parseInt(event.target.value, 10) || 0)))} />
        <label htmlFor="ingressos-meia" className="text-sm font-medium">Meia-entrada · R$ {halfPrice.toFixed(2)}</label>
        <Input id="ingressos-meia" type="number" min={0} max={Math.min(6, session.available_count)} step={1} value={halfQuantity}
          onChange={(event) => setHalfQuantity(Math.max(0, Math.min(6, Number.parseInt(event.target.value, 10) || 0)))} />
      </div>
      <p className="text-sm text-muted-foreground">Limite de 6 ingressos por pessoa. A reserva dura 15 minutos.</p>
      {quantity > 0 ? <p className="font-semibold">Subtotal: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}</p> : null}
      <Button type="button" disabled={isLoading || create.isPending || !canReserve} className="min-h-11 w-full" onClick={reserve}>
        {create.isPending ? 'Criando reserva…' : isAuthenticated ? 'Reservar ingressos' : 'Entrar para reservar'}
      </Button>
      {quantity > session.available_count ? <p role="alert" className="text-sm text-destructive">A quantidade selecionada excede a disponibilidade.</p> : null}
    </section>
  );
}
