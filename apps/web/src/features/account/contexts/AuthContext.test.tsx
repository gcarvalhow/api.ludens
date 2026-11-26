import { StrictMode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './AuthContext';
import { authService } from '@account/services/auth.service';
import { clearAccessToken } from '@web/lib/fetcher';

jest.mock('@account/services/auth.service', () => ({ authService: { refresh: jest.fn() } }));

function token(id: string) {
  return `header.${btoa(JSON.stringify({ sub: id }))}.signature`;
}
function Buyer() {
  const auth = useAuth();
  return <>
    <p role="status">{auth.isLoading ? 'loading' : auth.userId ?? 'visitor'}</p>
    <button onClick={() => auth.clearSession()}>Encerrar</button>
    <button onClick={() => void auth.setSession(token('new-buyer'))}>Nova conta</button>
  </>;
}
function show() {
  return render(<StrictMode><QueryClientProvider client={new QueryClient()}>
    <AuthProvider><Buyer /></AuthProvider>
  </QueryClientProvider></StrictMode>);
}
beforeEach(() => { jest.resetAllMocks(); clearAccessToken(); });

it('StrictMode não consome duas vezes o cookie de refresh na inicialização', async () => {
  (authService.refresh as jest.Mock).mockResolvedValue({ access_token: token('buyer'), expires_in: 1800 });
  show();
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('buyer'));
  expect(authService.refresh).toHaveBeenCalledTimes(1);
});

it('uma inicialização atrasada não restaura uma sessão explicitamente encerrada', async () => {
  let complete!: (value: unknown) => void;
  (authService.refresh as jest.Mock).mockReturnValue(new Promise((resolve) => { complete = resolve; }));
  show();
  fireEvent.click(screen.getByRole('button', { name: 'Encerrar' }));
  complete({ access_token: token('old-buyer'), expires_in: 1800 });
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('visitor'));
});

it('uma inicialização antiga não substitui o login de outro comprador', async () => {
  let complete!: (value: unknown) => void;
  (authService.refresh as jest.Mock).mockReturnValue(new Promise((resolve) => { complete = resolve; }));
  show();
  fireEvent.click(screen.getByRole('button', { name: 'Nova conta' }));
  complete({ access_token: token('old-buyer'), expires_in: 1800 });
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('new-buyer'));
});
