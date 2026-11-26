'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { Alert, AlertDescription, AlertTitle } from '@components/ui/alert';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Card, CardContent } from '@components/ui/card';
import { RequireAuth } from '@account/components/RequireAuth';
import { purchaseService } from '@booking/services/purchase.service';
import type { Ticket } from '@booking/server/types';
import { CancelOrderDialog } from '@booking/components/CancelOrderDialog';
import { orderBadge } from '@booking/lib/order-status';

const money = (cents: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
const date = (value: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full', timeStyle: 'short' }).format(new Date(value));

function TicketCard({ ticket, showTitle, sessionAt, venue }: { ticket: Ticket; showTitle: string; sessionAt: string; venue: string }) {
  return <article className="rounded-xl border-2 border-dashed border-primary/40 bg-card p-5 shadow-sm sm:p-7">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-widest text-primary">Ingresso de demonstração</p><h3 className="mt-1 text-lg font-semibold">{showTitle}</h3></div><Badge variant={ticket.status === 'valid' ? 'success' : ticket.status === 'used' ? 'secondary' : 'destructive'}>{ticket.status === 'valid' ? 'Válido' : ticket.status === 'used' ? 'Utilizado' : 'Cancelado'}</Badge></div>
    <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-muted-foreground">Sessão</dt><dd className="font-medium">{date(sessionAt)}</dd></div><div><dt className="text-muted-foreground">Local</dt><dd className="font-medium">{venue}</dd></div><div><dt className="text-muted-foreground">Tipo</dt><dd className="font-medium">{ticket.ticket_type === 'full' ? 'Inteira' : 'Meia-entrada'}</dd></div><div><dt className="text-muted-foreground">Preço demonstrativo</dt><dd className="font-medium">{money(ticket.price_cents)}</dd></div></dl>
    <div className="mt-5 rounded-lg bg-muted/60 px-4 py-5 text-center">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Código exclusivo</p>
      <p className="mt-2 break-all font-mono text-2xl font-bold tracking-[0.12em] sm:text-3xl" aria-label={`Código do ingresso ${ticket.code}`}>{ticket.code}</p>
      <p className="mt-2 text-xs text-muted-foreground">Apresente este código no celular. É um ingresso de demonstração e não autoriza entrada.</p>
    </div>
  </article>;
}

function HistoryContent({ mode, orderId }: { mode: 'orders' | 'tickets'; orderId: string | undefined }) {
  const orders = useQuery({ queryKey: ['booking', 'orders'], queryFn: purchaseService.listOrders, enabled: !orderId });
  const detail = useQuery({ queryKey: ['booking', 'order', orderId], queryFn: () => purchaseService.getOrder(orderId!), enabled: Boolean(orderId) });
  const items = orderId ? (detail.data ? [detail.data] : []) : (orders.data ?? []);
  const visibleItems = mode === 'tickets' ? items.filter((order) => order.tickets.length > 0) : items;
  const loading = orderId ? detail.isLoading : orders.isLoading;
  const error = orderId ? detail.isError : orders.isError;

  return <main className="mx-auto max-w-3xl space-y-5 px-4 py-8">
    <header><p className="text-sm font-medium text-primary">Área do comprador</p><h1 className="text-2xl font-semibold">{mode === 'tickets' ? 'Meus ingressos' : orderId ? 'Detalhes da compra' : 'Minhas compras'}</h1><p className="mt-1 text-sm text-muted-foreground">Pedidos e ingressos de demonstração. Nenhuma cobrança real é feita.</p></header>
    {loading ? <p role="status">Carregando…</p> : null}
    {error ? <Alert variant="destructive"><AlertTitle>Não foi possível carregar</AlertTitle><AlertDescription>Tente atualizar a página. Seus pedidos e ingressos continuam salvos.</AlertDescription></Alert> : null}
    {!loading && !error && visibleItems.length === 0 ? <Card><CardContent className="space-y-3 py-6"><p>{mode === 'tickets' ? 'Você ainda não tem ingressos emitidos.' : 'Você ainda não tem compras.'}</p><Button asChild><Link href="/">Explorar espetáculos</Link></Button></CardContent></Card> : null}
    {visibleItems.map((order) => <Card key={order.id} id={orderId ? `compra-${order.id}` : undefined}><CardContent className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">{order.show_title}</h2><Badge variant={orderBadge(order).variant}>{orderBadge(order).label}</Badge></div>
      <p className="text-sm text-muted-foreground">{date(order.session_starts_at)} · {order.venue}</p>
      <div className="grid gap-2 rounded-lg bg-muted/50 p-4 text-sm sm:grid-cols-2"><p>{order.full_quantity} inteira(s) · {order.half_quantity} meia(s)</p><p className="font-semibold">Total demonstrativo: {money(order.amount_cents)}</p></div>
      {order.cancelled_at ? <div className="space-y-1 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm" data-testid="cancellation-info">
        <p className="font-medium">{order.cancel_origin === 'session' ? 'Cancelado porque a sessão foi cancelada pelo teatro' : 'Cancelado por você'} em {date(order.cancelled_at)}</p>
        {order.cancel_reason ? <p>Motivo: {order.cancel_reason}</p> : null}
        {order.refund_cents != null ? <p>Reembolso simulado: {order.refund_percent}% ({money(order.refund_cents)}). Nenhum valor real foi devolvido.</p> : null}
      </div> : null}
      {order.status === 'pending' ? <div className="flex flex-wrap gap-2"><Button asChild className="min-h-11"><Link href={`/checkout/${order.reservation_id}`}>Retomar simulação</Link></Button><CancelOrderDialog order={order} /></div> : null}
      {order.status === 'paid' && new Date(order.session_starts_at) > new Date() && !order.tickets.some((t) => t.status === 'used') ? <CancelOrderDialog order={order} /> : null}
      {order.status === 'paid' && mode === 'orders' && !orderId ? <Button variant="outline" asChild><Link href={`/minhas-compras/${order.id}`}>Abrir detalhes e ingressos</Link></Button> : null}
      {(order.status === 'paid' || order.status === 'cancelled') && order.tickets.length ? <div className="grid gap-4">{order.tickets.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} showTitle={order.show_title} sessionAt={order.session_starts_at} venue={order.venue} />)}</div> : null}
    </CardContent></Card>)}
  </main>;
}

export function PurchaseHistory({ mode, orderId }: { mode: 'orders' | 'tickets'; orderId?: string }) {
  return <RequireAuth><HistoryContent mode={mode} orderId={orderId} /></RequireAuth>;
}
