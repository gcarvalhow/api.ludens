import { fetcher } from '@web/lib/fetcher';
import { endpoints } from '@web/routes/endpoints';

import type { AdminOrderPage, CancellationPreview, CheckInResult, PurchaseOrder, Reservation } from '@booking/server/types';

export const purchaseService = {
  getReservation(id: string) {
    return fetcher<Reservation>(endpoints.booking.reservation(id), { method: 'GET' });
  },
  startCheckout(reservationId: string) {
    return fetcher<PurchaseOrder>(endpoints.booking.checkout(reservationId), { method: 'POST' });
  },
  getOrder(id: string) {
    return fetcher<PurchaseOrder>(endpoints.booking.order(id), { method: 'GET' });
  },
  listOrders() {
    return fetcher<PurchaseOrder[]>(endpoints.booking.orders, { method: 'GET' });
  },
  simulatePayment(id: string, outcome: 'approved' | 'declined' | 'expired') {
    return fetcher<PurchaseOrder>(endpoints.booking.simulatePayment(id), {
      method: 'POST',
      body: JSON.stringify({ outcome }),
    });
  },
  cancellationPreview(id: string) {
    return fetcher<CancellationPreview>(endpoints.booking.cancellationPreview(id), { method: 'GET', cache: 'no-store' });
  },
  cancelOrder(id: string, reason?: string) {
    return fetcher<PurchaseOrder>(endpoints.booking.cancelOrder(id), {
      method: 'POST',
      body: JSON.stringify(reason?.trim() ? { reason: reason.trim() } : {}),
    });
  },
  listAdminOrders(page: number, status?: string) {
    const params = new URLSearchParams({ page: String(page), size: '20' });
    if (status) params.set('status', status);
    return fetcher<AdminOrderPage>(`${endpoints.booking.adminOrders}?${params}`, { method: 'GET', cache: 'no-store' });
  },
  checkIn(code: string) {
    return fetcher<CheckInResult>(endpoints.booking.checkIn, { method: 'POST', body: JSON.stringify({ code }) });
  },
  createReservation(input: { session_id: string; idempotency_key: string; full_quantity: number; half_quantity: number }) {
    return fetcher<Reservation>(endpoints.booking.reservations, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
};
