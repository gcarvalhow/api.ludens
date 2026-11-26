import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TicketPicker } from './TicketPicker';
import type { SessionDetail } from '@catalog/server/types';
import { ApiError } from '@web/lib/fetcher';

const mockPush = jest.fn();
const mockCreate = jest.fn();
let mockAuthenticated = false;

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@account/contexts/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: mockAuthenticated, isLoading: false }),
}));
jest.mock('@account/hooks/queries/useAccountQueries', () => ({
  useCurrentUser: () => ({ data: { is_admin: false }, isLoading: false }),
}));
jest.mock('@booking/hooks/useReservations', () => ({
  useReservationMutations: () => ({ create: { mutateAsync: mockCreate, isPending: false } }),
}));

const session: SessionDetail = {
  id: '2f4890ad-7249-4d94-9f8f-fc685fd5fe5e',
  show: { id: '2f4890ad-7249-4d94-9f8f-fc685fd5fe5f', title: 'Teste' },
  starts_at: new Date('2030-01-01T12:00:00Z'),
  venue: 'Teatro',
  capacity: 10,
  available_count: 10,
  status: 'on_sale',
  ticket_types: [
    { type: 'full', price: 10.01 },
    { type: 'half', price: 5 },
  ],
};

beforeEach(() => {
  localStorage.clear();
  mockPush.mockReset();
  mockCreate.mockReset();
  mockAuthenticated = false;
});

it('preserva quantidades e subtotais ao ir ao login e retornar, e abre a reserva persistida', async () => {
  const first = render(<TicketPicker session={session} />);
  fireEvent.change(await screen.findByLabelText(/Inteira —/), { target: { value: '2' } });
  fireEvent.change(screen.getByLabelText(/Meia-entrada —/), { target: { value: '1' } });
  expect(screen.getByLabelText('Subtotal Inteira')).toHaveTextContent('20,02');
  expect(screen.getByLabelText('Subtotal Meia-entrada')).toHaveTextContent('5,00');
  expect(screen.getByText('Total (3 ingressos)').parentElement).toHaveTextContent('25,02');
  fireEvent.click(screen.getByRole('button', { name: 'Reservar' }));
  expect(mockPush).toHaveBeenCalledWith(
    `/login?returnTo=${encodeURIComponent(`/sessoes/${session.id}`)}`,
  );
  expect(mockCreate).not.toHaveBeenCalled();
  first.unmount();
  mockAuthenticated = true;
  mockCreate.mockResolvedValue({ id: 'saved-reservation' });
  render(<TicketPicker session={session} />);
  expect(await screen.findByLabelText(/Inteira —/)).toHaveValue(2);
  expect(screen.getByLabelText(/Meia-entrada —/)).toHaveValue(1);
  fireEvent.click(screen.getByRole('button', { name: 'Reservar' }));
  await waitFor(() => expect(mockPush).toHaveBeenLastCalledWith('/checkout/saved-reservation'));
  expect(mockCreate).toHaveBeenCalledWith(
    expect.objectContaining({ full_quantity: 2, half_quantity: 1, session_id: session.id }),
  );
  expect(localStorage.getItem(`ludens:booking:draft:${session.id}`)).toBeNull();
});

it('recusa seleção acima do limite e acima da disponibilidade', async () => {
  render(<TicketPicker session={{ ...session, available_count: 2 }} />);
  fireEvent.change(await screen.findByLabelText(/Inteira —/), { target: { value: '3' } });
  expect(screen.getByRole('button', { name: 'Reservar' })).toBeDisabled();
  fireEvent.change(screen.getByLabelText(/Inteira —/), { target: { value: '6' } });
  fireEvent.change(screen.getByLabelText(/Meia-entrada —/), { target: { value: '1' } });
  expect(screen.getByRole('alert')).toHaveTextContent('Selecione de 1 a 6 ingressos');
});

it('reutiliza a chave após falha de rede e mostra a recusa específica do backend', async () => {
  mockAuthenticated = true;
  mockCreate
    .mockRejectedValueOnce(new TypeError('network'))
    .mockRejectedValueOnce(
      new ApiError(409, { detail: 'Não há ingressos suficientes para esta sessão.' }),
    );
  render(<TicketPicker session={session} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Reservar' }));
  await screen.findByText(/Não foi possível reservar/);
  fireEvent.click(screen.getByRole('button', { name: 'Reservar' }));
  await screen.findByText('Não há ingressos suficientes para esta sessão.');
  expect(mockCreate.mock.calls[0][0].idempotency_key).toBe(
    mockCreate.mock.calls[1][0].idempotency_key,
  );
  expect(mockPush).not.toHaveBeenCalled();
});

it('bloqueia submissões repetidas enquanto a mesma requisição está em andamento', async () => {
  mockAuthenticated = true;
  mockCreate.mockReturnValue(new Promise(() => {}));
  render(<TicketPicker session={session} />);
  const button = await screen.findByRole('button', { name: 'Reservar' });
  fireEvent.click(button);
  fireEvent.click(button);
  expect(mockCreate).toHaveBeenCalledTimes(1);
});
