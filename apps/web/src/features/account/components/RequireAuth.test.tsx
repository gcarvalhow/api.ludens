import { render, waitFor } from '@testing-library/react';
import { RequireAuth } from './RequireAuth';

const replace = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));
jest.mock('@account/contexts/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: false, isLoading: false }),
}));

it('preserva o destino completo da página protegida ao pedir login', async () => {
  window.history.replaceState(null, '', '/minha-conta?tab=seguranca#senha');
  const view = render(<RequireAuth><p>Dados privados</p></RequireAuth>);
  await waitFor(() => expect(replace).toHaveBeenCalledWith('/login?returnTo=%2Fminha-conta%3Ftab%3Dseguranca%23senha'));
  expect(view.queryByText('Dados privados')).not.toBeInTheDocument();
  window.history.replaceState(null, '', '/');
});
