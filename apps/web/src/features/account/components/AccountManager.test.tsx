import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AccountManager } from './AccountManager';
import { authService } from '@account/services/auth.service';
import { ApiError } from '@web/lib/fetcher';

const replace = jest.fn();
const clearSession = jest.fn();
const user = { id: 'buyer', name: 'Maria', email: 'maria@example.com', cpf: '52998224725', is_admin: false };
jest.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));
jest.mock('@account/contexts/AuthContext', () => ({ useAuth: () => ({ userId: 'buyer', clearSession }) }));
jest.mock('@account/hooks/queries/useAccountQueries', () => ({
  useCurrentUser: () => ({ data: user, isLoading: false, isError: false }),
}));
jest.mock('@account/services/auth.service', () => ({
  authService: { updateProfile: jest.fn(), changePassword: jest.fn(), requestEmailChange: jest.fn(), requestAccountDeletion: jest.fn() },
}));
function show() {
  const client = new QueryClient();
  render(<QueryClientProvider client={client}><AccountManager /></QueryClientProvider>);
  return client;
}
beforeEach(() => jest.resetAllMocks());

it('salva perfil e atualiza o cache da identificação do usuário', async () => {
  (authService.updateProfile as jest.Mock).mockResolvedValue({ ...user, name: 'Maria Silva' });
  const client = show();
  fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Maria Silva' } });
  fireEvent.submit(screen.getByRole('form', { name: 'Editar perfil' }));
  expect(await screen.findByRole('status')).toHaveTextContent('Perfil atualizado');
  expect(authService.updateProfile).toHaveBeenCalledWith({ name: 'Maria Silva' }, expect.anything());
  expect(client.getQueryData(['account', 'currentUser', 'buyer'])).toEqual({ ...user, name: 'Maria Silva' });
});

it('senha incorreta permanece na página e exibe erro acionável', async () => {
  (authService.changePassword as jest.Mock).mockRejectedValue(new ApiError(422, { detail: 'A senha atual não confere.' }));
  show();
  fireEvent.change(screen.getByLabelText('Senha atual'), { target: { value: 'incorreta' } });
  fireEvent.change(screen.getByLabelText('Nova senha'), { target: { value: 'nova-senha-123' } });
  fireEvent.submit(screen.getByRole('form', { name: 'Alterar senha' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('A senha atual não confere.');
  expect(clearSession).not.toHaveBeenCalled();
});

it('alterar senha encerra a sessão local e pede novo login', async () => {
  (authService.changePassword as jest.Mock).mockResolvedValue(undefined);
  show();
  expect(screen.getByText(/Alterar a senha encerra todas as sessões/)).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Senha atual'), { target: { value: 'senha-atual' } });
  fireEvent.change(screen.getByLabelText('Nova senha'), { target: { value: 'nova-senha-123' } });
  fireEvent.submit(screen.getByRole('form', { name: 'Alterar senha' }));
  await waitFor(() => expect(replace).toHaveBeenCalledWith('/login?reason=password-changed&returnTo=%2Fminha-conta'));
  expect(clearSession).toHaveBeenCalledTimes(1);
});

it('solicita troca por e-mail e exibe a entrega ao endereço atual', async () => {
  (authService.requestEmailChange as jest.Mock).mockResolvedValue({ message: 'Enviamos um link de confirmação para maria@example.com.' });
  show();
  fireEvent.change(screen.getByLabelText('Novo e-mail'), { target: { value: 'novo@example.com' } });
  fireEvent.change(screen.getByLabelText('Confirme o novo e-mail'), { target: { value: 'novo@example.com' } });
  fireEvent.submit(screen.getByRole('form', { name: 'Trocar e-mail' }));
  expect(await screen.findByRole('status')).toHaveTextContent('maria@example.com');
  expect(clearSession).not.toHaveBeenCalled();
});

it('solicitar exclusão não exclui imediatamente e exige ciência da preservação', async () => {
  (authService.requestAccountDeletion as jest.Mock).mockResolvedValue({ message: 'Link enviado.' });
  show();
  const button = screen.getByRole('button', { name: 'Solicitar exclusão da conta' });
  expect(button).toBeDisabled();
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(button);
  expect(await screen.findByRole('status')).toHaveTextContent('Sua conta continua ativa até a confirmação');
  expect(clearSession).not.toHaveBeenCalled();
});
