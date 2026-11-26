import { fireEvent, render, screen, within } from '@testing-library/react';
import { SessionDatePicker } from './SessionDatePicker';
import type { SessionDetail, SessionSummary } from '@catalog/server/types';

const session: SessionDetail = {
  id: 'current',
  show: { id: 'show', title: 'Cartas do Amanhã' },
  starts_at: new Date('2099-01-02T22:00:00Z'),
  venue: 'Sala atual',
  capacity: 60,
  available_count: 60,
  status: 'on_sale',
  ticket_types: [],
};
const nearest: SessionSummary = {
  id: 'nearest',
  starts_at: new Date('2099-01-03T22:00:00Z'),
  venue: 'Sala próxima',
  status: 'on_sale',
  capacity: 60,
  available_count: 40,
};
const later: SessionSummary = {
  ...nearest,
  id: 'later',
  starts_at: new Date('2099-01-10T22:00:00Z'),
  venue: 'Sala posterior',
};
let mockSessions: SessionSummary[] = [];
let mockPending = false;
let mockError = false;
const mockRefetch = jest.fn();
const mockQuery = jest.fn();

jest.mock('@catalog/hooks/queries/useCatalogQueries', () => ({
  useSessionDateOptions: (showId: string, enabled: boolean) => {
    mockQuery(showId, enabled);
    return {
      data: { sessions: mockSessions },
      isPending: mockPending,
      isError: mockError,
      refetch: mockRefetch,
    };
  },
}));

beforeEach(() => {
  mockSessions = [
    later,
    { ...nearest, id: session.id },
    nearest,
    { ...nearest, id: 'cancelled', status: 'cancelled' },
    { ...nearest, id: 'full', available_count: 0, status: 'sold_out' },
    { ...nearest, id: 'past', starts_at: new Date('2000-01-01T22:00:00Z') },
  ];
  mockPending = false;
  mockError = false;
  mockRefetch.mockReset();
  mockQuery.mockReset();
});

it('mostra o botão na página e consulta outras datas ao abrir o seletor', () => {
  render(<SessionDatePicker session={session} />);
  expect(mockQuery).toHaveBeenLastCalledWith(session.show.id, false);
  fireEvent.click(screen.getByRole('button', { name: 'Escolher outra data' }));
  expect(mockQuery).toHaveBeenLastCalledWith(session.show.id, true);
  const dialog = screen.getByRole('dialog');
  expect(within(dialog).getByRole('heading')).toHaveTextContent('Outras datas de Cartas do Amanhã');
  const links = within(dialog).getAllByRole('link');
  expect(links).toHaveLength(2);
  expect(links[0]).toHaveAttribute('href', '/sessoes/nearest');
  expect(links[0]).toHaveTextContent('Mais próxima');
  expect(links[1]).toHaveAttribute('href', '/sessoes/later');
});

it('explica quando nenhuma outra data está disponível', () => {
  mockSessions = [];
  render(<SessionDatePicker session={session} />);
  fireEvent.click(screen.getByRole('button', { name: 'Escolher outra data' }));
  expect(screen.getByRole('status')).toHaveTextContent('Não há outras datas futuras com vagas');
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
});

it('mostra carregamento e permite tentar novamente em caso de falha', () => {
  mockPending = true;
  const view = render(<SessionDatePicker session={session} />);
  fireEvent.click(screen.getByRole('button', { name: 'Escolher outra data' }));
  expect(screen.getByRole('status')).toHaveTextContent('Buscando outras datas');
  mockPending = false;
  mockError = true;
  view.rerender(<SessionDatePicker session={session} />);
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
  expect(mockRefetch).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
});
