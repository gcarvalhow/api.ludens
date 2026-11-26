import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AccountConfirmation } from './AccountConfirmation';
import { authService } from '@account/services/auth.service';
import { ApiError } from '@web/lib/fetcher';

const clearSession = jest.fn();
jest.mock('@account/contexts/AuthContext', () => ({ useAuth: () => ({ clearSession }) }));
jest.mock('@account/services/auth.service', () => ({
  authService: { confirmEmailChange: jest.fn(), confirmAccountDeletion: jest.fn() },
}));
function show(kind: 'email' | 'deletion', token = 'one-use-token') {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}>
    <AccountConfirmation kind={kind} token={token} />
  </QueryClientProvider>);
}
beforeEach(() => jest.resetAllMocks());

it('abrir o link não confirma; exige ação e limpa a sessão após sucesso', async () => {
  (authService.confirmEmailChange as jest.Mock).mockResolvedValue(undefined);
  show('email');
  expect(authService.confirmEmailChange).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar troca de e-mail' }));
  await screen.findByRole('status');
  expect(authService.confirmEmailChange).toHaveBeenCalledWith('one-use-token');
  expect(clearSession).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('link', { name: 'Entrar novamente' })).toHaveAttribute('href', '/login');
});

it('expirado, inválido ou já utilizado permite solicitar novo link, sem repetir confirmação', async () => {
  (authService.confirmEmailChange as jest.Mock).mockRejectedValue(new ApiError(410, {}));
  show('email');
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar troca de e-mail' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('expirou, é inválido ou já foi utilizado');
  expect(screen.getByRole('button', { name: 'Confirmar troca de e-mail' })).toBeDisabled();
  expect(screen.getByRole('link', { name: /solicitar novo link/ })).toHaveAttribute('href', '/minha-conta');
  expect(clearSession).not.toHaveBeenCalled();
});

it('token ausente não dispara nenhuma requisição', () => {
  show('deletion', '');
  expect(screen.getByRole('alert')).toHaveTextContent('Link inválido');
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  expect(authService.confirmAccountDeletion).not.toHaveBeenCalled();
});

it('exclusão exige ciência da preservação do histórico e confirmação explícita', async () => {
  (authService.confirmAccountDeletion as jest.Mock).mockResolvedValue(undefined);
  show('deletion');
  expect(screen.getByText(/os dados não são apagados automaticamente/)).toBeInTheDocument();
  const button = screen.getByRole('button', { name: 'Confirmar exclusão da conta' });
  expect(button).toBeDisabled();
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(button);
  await waitFor(() => expect(clearSession).toHaveBeenCalledTimes(1));
  expect(authService.confirmAccountDeletion).toHaveBeenCalledWith('one-use-token');
  expect(screen.getByRole('status')).toHaveTextContent('histórico comercial foi preservado');
});

it('erro de conexão permite tentar novamente e não encerra a sessão', async () => {
  (authService.confirmEmailChange as jest.Mock).mockRejectedValue(new Error('offline'));
  show('email');
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar troca de e-mail' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Verifique sua conexão');
  expect(screen.getByRole('button', { name: 'Confirmar troca de e-mail' })).toBeEnabled();
  expect(clearSession).not.toHaveBeenCalled();
});

it('um novo link substitui o erro do anterior sem exigir recarregar a página', async () => {
  (authService.confirmEmailChange as jest.Mock).mockRejectedValueOnce(new ApiError(410, {}));
  const client = new QueryClient();
  const view = render(<QueryClientProvider client={client}>
    <AccountConfirmation kind="email" token="expired" />
  </QueryClientProvider>);
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar troca de e-mail' }));
  await screen.findByRole('alert');
  view.rerender(<QueryClientProvider client={client}>
    <AccountConfirmation kind="email" token="fresh" />
  </QueryClientProvider>);
  expect(screen.getByRole('button', { name: 'Confirmar troca de e-mail' })).toBeEnabled();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
