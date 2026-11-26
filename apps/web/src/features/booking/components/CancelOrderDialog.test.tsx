import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { CancelOrderDialog } from './CancelOrderDialog';
import { orderBadge } from '@booking/lib/order-status';
import { purchaseService } from '@booking/services/purchase.service';
import type { PurchaseOrder } from '@booking/server/types';

jest.mock('sonner', () => ({ toast: { success: jest.fn() } }));
jest.mock('@booking/services/purchase.service', () => ({
  purchaseService: { cancellationPreview: jest.fn(), cancelOrder: jest.fn() },
}));

const service = purchaseService as jest.Mocked<typeof purchaseService>;

const order: PurchaseOrder = {
  id: 'order-1',
  reservation_id: 'res-1',
  session_id: 'session-1',
  show_title: 'Hamlet',
  session_starts_at: '2030-01-10T20:00:00Z',
  venue: 'Teatro',
  full_quantity: 2,
  half_quantity: 0,
  full_price_cents: 5000,
  half_price_cents: 2500,
  amount_cents: 10000,
  status: 'paid',
  expires_at: '2030-01-01T00:00:00Z',
  resolved_at: null,
  tickets: [],
  is_demonstration: true,
};

function renderDialog(value: PurchaseOrder = order) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <CancelOrderDialog order={value} />
    </QueryClientProvider>,
  );
}

beforeEach(() => jest.resetAllMocks());

it('mostra as consequências simuladas antes de confirmar e cancela com o motivo', async () => {
  service.cancellationPreview.mockResolvedValue({
    order_id: 'order-1',
    can_cancel: true,
    order_status: 'paid',
    ticket_count: 2,
    refund_percent: 50,
    refund_cents: 5000,
    message: 'Os 2 ingresso(s) serão invalidados.',
    is_refund_simulated: true,
  });
  service.cancelOrder.mockResolvedValue({ ...order, status: 'cancelled' });
  renderDialog();

  fireEvent.click(screen.getByRole('button', { name: 'Cancelar pedido' }));
  expect(await screen.findByText('Os 2 ingresso(s) serão invalidados.')).toBeInTheDocument();
  expect(screen.getByText(/Reembolso simulado: 50%/)).toBeInTheDocument();
  expect(screen.getByText(/nenhum valor será devolvido/i)).toBeInTheDocument();
  expect(service.cancelOrder).not.toHaveBeenCalled();

  fireEvent.change(screen.getByLabelText('Motivo (opcional)'), { target: { value: 'Imprevisto' } });
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar cancelamento' }));
  await waitFor(() => expect(service.cancelOrder).toHaveBeenCalledWith('order-1', 'Imprevisto'));
});

it('não permite confirmar quando o cancelamento está bloqueado', async () => {
  service.cancellationPreview.mockResolvedValue({
    order_id: 'order-1',
    can_cancel: false,
    order_status: 'paid',
    ticket_count: 2,
    refund_percent: null,
    refund_cents: null,
    message: 'Faltam menos de 24h para a sessão.',
    is_refund_simulated: true,
  });
  renderDialog();

  fireEvent.click(screen.getByRole('button', { name: 'Cancelar pedido' }));
  expect(await screen.findByText('Faltam menos de 24h para a sessão.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Confirmar cancelamento' })).toBeDisabled();
});

it('diferencia reserva pendente, pedido confirmado e pedido cancelado', () => {
  expect(orderBadge({ status: 'pending', cancelled_at: null, tickets: [] }).label).toMatch(/pendente/i);
  expect(orderBadge({ status: 'paid', cancelled_at: null, tickets: [] }).label).toMatch(/confirmado/i);
  expect(orderBadge({ status: 'cancelled', cancelled_at: '2030-01-01T00:00:00Z', tickets: [] }).label).toBe(
    'Pedido cancelado',
  );
  expect(orderBadge({ status: 'cancelled', cancelled_at: null, tickets: [] }).label).toBe('Reserva cancelada');
});
