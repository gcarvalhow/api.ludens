'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Alert, AlertDescription, AlertTitle } from '@components/ui/alert';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { RequireAuth } from '@account/components/RequireAuth';
import { ApiError } from '@web/lib/fetcher';
import { purchaseService } from '@booking/services/purchase.service';
import type { PurchaseOrder } from '@booking/server/types';

const money = (cents: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
const date = (value: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full', timeStyle: 'short' }).format(new Date(value));

function message(error: unknown) {
  if (error instanceof ApiError) {
    const detail = (error.data as { detail?: unknown } | undefined)?.detail;
    if (typeof detail === 'string') return detail;
  }
  return 'Não foi possível abrir o pedido. Confira sua reserva e tente novamente.';
}

function CheckoutContent({ reservationId }: { reservationId: string }) {
  const queryClient = useQueryClient();
  const started = useRef(false);
  const [now, setNow] = useState(Date.now());
  const [orderId, setOrderId] = useState<string | null>(null);
  const reservation = useQuery({ queryKey: ['booking', 'reservation', reservationId], queryFn: () => purchaseService.getReservation(reservationId) });
  const order = useQuery<PurchaseOrder>({
    queryKey: ['booking', 'order', orderId],
    queryFn: () => purchaseService.getOrder(orderId!),
    enabled: Boolean(orderId),
    refetchInterval: (query) => query.state.data?.status === 'pending' ? 2000 : false,
  });
  const start = useMutation({
    mutationFn: () => purchaseService.startCheckout(reservationId),
    onSuccess: (value) => {
      setOrderId(value.id);
      queryClient.setQueryData(['booking', 'order', value.id], value);
    },
  });
  const simulate = useMutation({
    mutationFn: (outcome: 'approved' | 'declined' | 'expired') => {
      if (!order.data) throw new Error('Pedido ainda não carregado.');
      return purchaseService.simulatePayment(order.data.id, outcome);
    },
    onSuccess: (value) => {
      queryClient.setQueryData(['booking', 'order', value.id], value);
      void queryClient.invalidateQueries({ queryKey: ['booking', 'orders'] });
      if (value.status === 'paid') toast.success('Compra demonstrativa confirmada. Seus ingressos foram emitidos.');
      if (value.status === 'declined') toast.info('Simulação recusada. A reserva foi liberada.');
    },
    onError: (error) => toast.error(message(error)),
  });

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (reservation.data && !started.current) {
      started.current = true;
      start.mutate();
    }
  }, [reservation.data, start]);

  const currentOrder = order.data;
  const secondsLeft = currentOrder ? Math.max(0, Math.floor((new Date(currentOrder.expires_at).getTime() - now) / 1000)) : 0;
  const pending = currentOrder?.status === 'pending' && secondsLeft > 0;
  const statusText = currentOrder?.status === 'paid' ? 'Compra confirmada' : currentOrder?.status === 'declined' ? 'Simulação recusada' : currentOrder?.status === 'cancelled' ? 'Reserva cancelada' : currentOrder?.status === 'expired' || (currentOrder?.status === 'pending' && secondsLeft === 0) ? 'Prazo expirado' : 'Aguardando sua escolha';

  return <main className="mx-auto max-w-2xl space-y-5 px-4 py-8">
    <div><p className="text-sm font-medium text-primary">Checkout demonstrativo</p><h1 className="text-2xl font-semibold">Revise seu pedido</h1></div>
    {reservation.isLoading ? <p role="status">Carregando reserva…</p> : null}
    {reservation.isError ? <Alert variant="destructive"><AlertTitle>Não foi possível abrir a reserva</AlertTitle><AlertDescription>{message(reservation.error)}</AlertDescription></Alert> : null}
    {start.isError ? <Alert variant="destructive"><AlertTitle>Pedido indisponível</AlertTitle><AlertDescription>{message(start.error)}</AlertDescription></Alert> : null}
    {reservation.data ? <Card><CardHeader><CardTitle>{reservation.data.show_title}</CardTitle></CardHeader><CardContent className="space-y-4">
      <p>{date(reservation.data.starts_at)} · {reservation.data.venue}</p>
      <div className="space-y-2 rounded-lg bg-muted/50 p-4 text-sm">
        {reservation.data.full_quantity ? <p className="flex justify-between"><span>{reservation.data.full_quantity} × Inteira</span><span>{money(reservation.data.full_quantity * reservation.data.full_price_cents)}</span></p> : null}
        {reservation.data.half_quantity ? <p className="flex justify-between"><span>{reservation.data.half_quantity} × Meia-entrada</span><span>{money(reservation.data.half_quantity * reservation.data.half_price_cents)}</span></p> : null}
        <p className="flex justify-between border-t pt-2 text-base font-semibold"><span>Total</span><span>{money(reservation.data.total_cents)}</span></p>
      </div>
      <Alert><AlertTitle>Pagamento de demonstração</AlertTitle><AlertDescription>Nenhuma cobrança será feita. Não informe dados bancários; os botões abaixo simulam aprovação, recusa ou expiração. O pedido expira junto com a reserva, em {date(currentOrder?.expires_at ?? reservation.data.expires_at)}.</AlertDescription></Alert>
    </CardContent></Card> : null}
    {start.isError && !currentOrder ? <Button type="button" variant="outline" onClick={() => start.mutate()}>Tentar preparar o pedido novamente</Button> : null}
    {currentOrder ? <Card><CardContent className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">Etapa da simulação</h2><Badge variant={currentOrder.status === 'paid' ? 'success' : currentOrder.status === 'pending' ? 'warning' : 'secondary'}>{statusText}</Badge></div>
      {pending ? <>
        <p className="text-sm">Tempo restante: <strong>{Math.floor(secondsLeft / 60).toString().padStart(2, '0')}:{(secondsLeft % 60).toString().padStart(2, '0')}</strong></p>
        <p className="text-sm text-muted-foreground">Você pode retomar este pedido enquanto a reserva estiver válida.</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <Button className="min-h-11" disabled={simulate.isPending} onClick={() => simulate.mutate('approved')}>{simulate.isPending ? 'Processando…' : 'Simular aprovação'}</Button>
          <Button variant="outline" className="min-h-11" disabled={simulate.isPending} onClick={() => simulate.mutate('declined')}>Simular recusa</Button>
          <Button variant="outline" className="min-h-11" disabled={simulate.isPending} onClick={() => simulate.mutate('expired')}>Simular expiração</Button>
        </div>
      </> : null}
      {currentOrder.status === 'paid' ? <><p>Os ingressos foram emitidos com códigos exclusivos de demonstração.</p><Button asChild className="min-h-11"><Link href={`/minhas-compras/${currentOrder.id}`}>Ver pedido e ingressos</Link></Button></> : null}
      {currentOrder.status === 'declined' || currentOrder.status === 'expired' || currentOrder.status === 'cancelled' || secondsLeft === 0 && currentOrder.status === 'pending' ? <p role="status">Este pedido foi encerrado e os lugares foram liberados. Você pode iniciar uma nova reserva na página da sessão.</p> : null}
    </CardContent></Card> : start.isPending ? <p role="status">Preparando seu pedido…</p> : null}
    <Button variant="outline" asChild><Link href="/minhas-compras">Ver minhas compras</Link></Button>
  </main>;
}

export function CheckoutFlow({ reservationId }: { reservationId: string }) {
  return <RequireAuth><CheckoutContent reservationId={reservationId} /></RequireAuth>;
}
