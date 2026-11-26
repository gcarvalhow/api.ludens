import { act, render, screen } from '@testing-library/react';
import { remainingSeconds, ReservationSummary } from './ReservationSummary';
import type { Reservation } from '@booking/server/types/reservation.types';

jest.mock('./RebookingOptions', () => ({
  RebookingOptions: ({ reservationId }: { reservationId: string }) => (
    <div data-testid="rebooking-options">{reservationId}</div>
  ),
}));

const reservation: Reservation = {
  id: '2f4890ad-7249-4d94-9f8f-fc685fd5fe5e',
  session_id: '2f4890ad-7249-4d94-9f8f-fc685fd5fe5f',
  show_title: 'Hamlet',
  venue: 'Teatro',
  status: 'open',
  full_quantity: 1,
  half_quantity: 1,
  full_price_cents: 1001,
  half_price_cents: 500,
  total_cents: 1501,
  starts_at: '2030-01-02T12:00:00Z',
  created_at: '2030-01-01T12:00:00Z',
  expires_at: '2030-01-01T12:00:02Z',
  server_now: '2030-01-01T12:00:00Z',
};

it('usa a hora do servidor para resistir ao relógio local incorreto', () => {
  expect(remainingSeconds(reservation.expires_at, reservation.server_now, 100, 1100)).toBe(1);
  expect(remainingSeconds(reservation.expires_at, reservation.server_now, 100, 99999)).toBe(0);
});

it('revalida ao zerar e só anuncia expiração depois da resposta do servidor', () => {
  jest.useFakeTimers();
  const refetch = jest.fn();
  const receivedAt = Date.now();
  const view = render(
    <ReservationSummary reservation={reservation} receivedAt={receivedAt} onExpire={refetch} />,
  );
  act(() => {
    jest.advanceTimersByTime(3000);
  });
  expect(refetch).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('timer')).toHaveTextContent('Confirmando expiração');
  view.rerender(
    <ReservationSummary
      reservation={{ ...reservation, status: 'expired' }}
      receivedAt={receivedAt}
      onExpire={refetch}
    />,
  );
  expect(screen.getByRole('status')).toHaveTextContent('A reserva expirou');
  expect(screen.getByTestId('rebooking-options')).toHaveTextContent(reservation.id);
  view.unmount();
  jest.useRealTimers();
});

it('permite buscar novas sessões após uma sessão de reserva confirmada já ter passado', () => {
  render(
    <ReservationSummary
      reservation={{ ...reservation, status: 'confirmed', starts_at: '2029-01-01T12:00:00Z' }}
      receivedAt={Date.now()}
    />,
  );
  expect(screen.getByTestId('rebooking-options')).toHaveTextContent(reservation.id);
});
