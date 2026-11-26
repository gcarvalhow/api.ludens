import { fireEvent, render, screen } from '@testing-library/react';
import { RebookingOptions } from './RebookingOptions';

const next = {
  id: 'next-session',
  starts_at: '2030-01-02T12:00:00Z',
  venue: 'Sala A',
  available_count: 3,
};
const later = {
  id: 'later-session',
  starts_at: '2030-01-03T12:00:00Z',
  venue: 'Sala B',
  available_count: 5,
};
let mockSessions = [next, later];
let mockPending = false;
let mockError = false;
const mockRefetch = jest.fn();

jest.mock('@booking/hooks/useReservations', () => ({
  useRebookingOptions: () => ({
    data: { sessions: mockSessions, server_now: '2030-01-01T12:00:00Z' },
    dataUpdatedAt: Date.now(),
    isPending: mockPending,
    isError: mockError,
    refetch: mockRefetch,
  }),
}));

beforeEach(() => {
  mockSessions = [next, later];
  mockPending = false;
  mockError = false;
  mockRefetch.mockReset();
});

it('aponta inicialmente para a sessão mais próxima e permite selecionar datas posteriores', () => {
  render(<RebookingOptions reservationId="previous-reservation" />);
  expect(screen.getByRole('link', { name: 'Reservar novamente' })).toHaveAttribute(
    'href',
    '/sessoes/next-session',
  );
  const select = screen.getByLabelText('Escolher sessão');
  expect(select).toHaveValue(next.id);
  expect(screen.getByRole('option', { name: /Mais próxima/ })).toHaveValue(next.id);
  fireEvent.change(select, { target: { value: later.id } });
  expect(screen.getByRole('link', { name: 'Reservar novamente' })).toHaveAttribute(
    'href',
    '/sessoes/later-session',
  );
});

it('mostra a única próxima sessão sem um seletor desnecessário', () => {
  mockSessions = [next];
  render(<RebookingOptions reservationId="previous-reservation" />);
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  expect(screen.getByText(/Próxima sessão:/)).toHaveTextContent('Sala A');
  expect(screen.getByRole('link', { name: 'Reservar novamente' })).toHaveAttribute(
    'href',
    '/sessoes/next-session',
  );
});

it('não oferece links inválidos quando não há sessões futuras com vagas', () => {
  mockSessions = [
    { ...next, available_count: 0 },
    { ...later, starts_at: '2029-01-01T12:00:00Z' },
  ];
  render(<RebookingOptions reservationId="previous-reservation" />);
  expect(screen.getByText(/Não há outras sessões futuras com vagas/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Reservar novamente' })).toBeDisabled();
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
});

it('substitui a seleção por uma opção válida caso ela deixe de estar disponível', () => {
  const view = render(<RebookingOptions reservationId="previous-reservation" />);
  fireEvent.change(screen.getByLabelText('Escolher sessão'), { target: { value: later.id } });
  mockSessions = [next];
  view.rerender(<RebookingOptions reservationId="previous-reservation" />);
  expect(screen.getByRole('link', { name: 'Reservar novamente' })).toHaveAttribute(
    'href',
    '/sessoes/next-session',
  );
});

it('aguarda carregar e permite repetir uma consulta que falhou', () => {
  mockPending = true;
  const view = render(<RebookingOptions reservationId="previous-reservation" />);
  expect(screen.getByRole('button', { name: /Buscando próximas sessões/ })).toBeDisabled();
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
  mockPending = false;
  mockError = true;
  view.rerender(<RebookingOptions reservationId="previous-reservation" />);
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
  expect(mockRefetch).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
});
