import type { PurchaseOrder } from '@booking/server/types';

type BadgeVariant = 'success' | 'warning' | 'destructive' | 'secondary';

export function orderBadge(order: Pick<PurchaseOrder, 'status' | 'cancelled_at' | 'tickets'>): {
  label: string;
  variant: BadgeVariant;
} {
  switch (order.status) {
    case 'pending':
      return { label: 'Reserva pendente · pagamento simulado', variant: 'warning' };
    case 'paid':
      return { label: 'Pedido confirmado · demonstração', variant: 'success' };
    case 'cancelled':
      return order.cancelled_at || order.tickets.length > 0
        ? { label: 'Pedido cancelado', variant: 'destructive' }
        : { label: 'Reserva cancelada', variant: 'secondary' };
    case 'declined':
      return { label: 'Simulação recusada', variant: 'destructive' };
    default:
      return { label: 'Expirado', variant: 'secondary' };
  }
}
