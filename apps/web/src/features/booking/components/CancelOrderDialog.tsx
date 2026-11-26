'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@components/ui/button';
import { Textarea } from '@components/ui/textarea';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@components/ui/alert-dialog';
import { apiErrorMessage } from '@catalog/lib/errors';
import { purchaseService } from '@booking/services/purchase.service';
import type { PurchaseOrder } from '@booking/server/types';

const money = (cents: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);

export function CancelOrderDialog({ order }: { order: PurchaseOrder }) {
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const isPaid = order.status === 'paid';

  const preview = useQuery({
    queryKey: ['booking', 'cancellation-preview', order.id],
    queryFn: () => purchaseService.cancellationPreview(order.id),
    enabled: open,
    staleTime: 0,
    retry: false,
  });

  const cancel = useMutation({
    mutationFn: () => purchaseService.cancelOrder(order.id, reason),
    onSuccess: async () => {
      setOpen(false);
      toast.success(isPaid ? 'Pedido cancelado. O reembolso é apenas simulado.' : 'Reserva cancelada.');
      await Promise.all([
        client.invalidateQueries({ queryKey: ['booking'] }),
        client.invalidateQueries({ queryKey: ['catalog'] }),
      ]);
    },
    onError: (cause) => setError(apiErrorMessage(cause, 'Não foi possível cancelar. Tente novamente.')),
  });

  const data = preview.data;
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setError('');
          setReason('');
        }
      }}
    >
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="min-h-11">
          {isPaid ? 'Cancelar pedido' : 'Cancelar reserva'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{isPaid ? 'Cancelar este pedido?' : 'Cancelar esta reserva?'}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-left">
              {preview.isPending ? <p role="status">Calculando as consequências…</p> : null}
              {preview.isError ? (
                <p role="alert">Não foi possível calcular as consequências. Tente novamente.</p>
              ) : null}
              {data ? <p>{data.message}</p> : null}
              {data?.refund_cents != null && data.can_cancel ? (
                <p className="font-medium text-foreground">
                  Reembolso simulado: {data.refund_percent}% ({money(data.refund_cents)})
                </p>
              ) : null}
              <p className="text-xs">
                Demonstração: nenhum pagamento real foi feito e nenhum valor será devolvido.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        {data?.can_cancel ? (
          <div className="space-y-1">
            <label htmlFor={`motivo-${order.id}`} className="text-sm font-medium">
              Motivo (opcional)
            </label>
            <Textarea
              id={`motivo-${order.id}`}
              value={reason}
              maxLength={300}
              onChange={(event) => setReason(event.target.value)}
            />
          </div>
        ) : null}
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel>Manter</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={!data?.can_cancel || cancel.isPending}
            onClick={() => {
              setError('');
              cancel.mutate();
            }}
          >
            {cancel.isPending ? 'Cancelando…' : 'Confirmar cancelamento'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
