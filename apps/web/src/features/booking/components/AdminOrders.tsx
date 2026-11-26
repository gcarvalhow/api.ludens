'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@components/ui/alert';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Card, CardContent } from '@components/ui/card';
import { Input } from '@components/ui/input';
import { apiErrorMessage } from '@catalog/lib/errors';
import { purchaseService } from '@booking/services/purchase.service';
import { orderBadge } from '@booking/lib/order-status';
import type { CheckInResult } from '@booking/server/types';

const money = (cents: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
const date = (value: string) =>
  new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));

const FILTERS = [
  { value: '', label: 'Todos' },
  { value: 'pending', label: 'Pendentes' },
  { value: 'paid', label: 'Confirmados' },
  { value: 'cancelled', label: 'Cancelados' },
] as const;

function CheckInPanel() {
  const client = useQueryClient();
  const [code, setCode] = useState('');
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [error, setError] = useState('');
  const checkIn = useMutation({
    mutationFn: () => purchaseService.checkIn(code.trim()),
    onSuccess: async (data) => {
      setResult(data);
      setError('');
      setCode('');
      await client.invalidateQueries({ queryKey: ['booking', 'admin-orders'] });
    },
    onError: (cause) => {
      setResult(null);
      setError(apiErrorMessage(cause, 'Não foi possível validar o ingresso.'));
    },
  });
  return (
    <Card>
      <CardContent className="space-y-3">
        <h2 className="text-lg font-semibold">Check-in de ingresso</h2>
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (code.trim()) checkIn.mutate();
          }}
        >
          <label htmlFor="checkin-code" className="sr-only">
            Código do ingresso
          </label>
          <Input
            id="checkin-code"
            className="max-w-sm font-mono"
            placeholder="DEMO-…"
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />
          <Button type="submit" disabled={!code.trim() || checkIn.isPending}>
            {checkIn.isPending ? 'Validando…' : 'Validar entrada'}
          </Button>
        </form>
        {result ? (
          <p role="status" className="text-sm text-emerald-700 dark:text-emerald-400">
            Entrada liberada: {result.show_title} · {result.ticket_type === 'full' ? 'Inteira' : 'Meia'} ({result.code})
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function AdminOrders() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const query = useQuery({
    queryKey: ['booking', 'admin-orders', page, status],
    queryFn: () => purchaseService.listAdminOrders(page, status || undefined),
    staleTime: 0,
  });

  return (
    <main className="mx-auto max-w-4xl space-y-5 p-6">
      <Link href="/admin" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" />
        Painel administrativo
      </Link>
      <header>
        <h1 className="text-2xl font-semibold">Pedidos e cancelamentos</h1>
        <p className="text-sm text-muted-foreground">
          Pedidos de demonstração. Reembolsos são apenas simulados.
        </p>
      </header>

      <CheckInPanel />

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por status">
        {FILTERS.map((filter) => (
          <Button
            key={filter.value}
            variant={status === filter.value ? 'default' : 'outline'}
            aria-pressed={status === filter.value}
            onClick={() => {
              setStatus(filter.value);
              setPage(1);
            }}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {query.isPending ? <p role="status">Carregando pedidos…</p> : null}
      {query.isError ? (
        <Alert variant="destructive">
          <AlertTitle>Não foi possível carregar os pedidos</AlertTitle>
          <AlertDescription>
            <Button variant="outline" onClick={() => void query.refetch()}>
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}
      {query.data?.items.length === 0 ? <p>Nenhum pedido encontrado.</p> : null}

      {query.data?.items.map((order) => {
        const badge = orderBadge(order);
        return (
          <Card key={order.id}>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold">{order.show_title}</h2>
                <Badge variant={badge.variant}>{badge.label}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {date(order.session_starts_at)} · {order.venue}
              </p>
              <p className="text-sm">
                Comprador: {order.buyer_name} ({order.buyer_email}) · {order.full_quantity} inteira(s),{' '}
                {order.half_quantity} meia(s) · {money(order.amount_cents)}
              </p>
              {order.cancelled_at ? (
                <p className="text-sm" data-testid="admin-cancellation-info">
                  Cancelado em {date(order.cancelled_at)} (
                  {order.cancel_origin === 'session' ? 'sessão cancelada pelo teatro' : 'pelo comprador'}
                  ). Motivo: {order.cancel_reason}. Reembolso simulado: {order.refund_percent}% (
                  {money(order.refund_cents ?? 0)}).
                </p>
              ) : null}
            </CardContent>
          </Card>
        );
      })}

      {query.data && query.data.total > query.data.size ? (
        <nav aria-label="Paginação de pedidos" className="flex items-center justify-between">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </Button>
          <span>Página {page}</span>
          <Button
            variant="outline"
            disabled={page * query.data.size >= query.data.total}
            onClick={() => setPage((p) => p + 1)}
          >
            Próxima
          </Button>
        </nav>
      ) : null}
    </main>
  );
}
