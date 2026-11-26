'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useAuth } from '@account/contexts/AuthContext';
import { authService } from '@account/services/auth.service';

export function useAuthMutations() {
  const { login, logout, setSession } = useAuth();

  const registerMutation = useMutation({
    mutationFn: authService.register,

    onSuccess: async (response) => {
      await setSession(response.access_token);

      toast.success('Conta criada com sucesso.');
    },

    onError: () => {
      toast.error('Não foi possível criar sua conta.');
    },
  });

  const loginMutation = useMutation({
    mutationFn: login,

    onSuccess: () => {
      toast.success('Login realizado com sucesso.');
    },

    onError: () => {
      toast.error('E-mail ou senha inválidos.');
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logout,

    onSuccess: () => {
      toast.success('Logout realizado com sucesso.');
    },

    onError: () => {
      toast.error('Não foi possível encerrar a sessão.');
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: authService.changePassword,

    onSuccess: () => {
      toast.success('Senha alterada com sucesso.');
    },

    onError: () => {
      toast.error('Não foi possível alterar a senha.');
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: authService.forgotPassword,

    onSuccess: (response) => {
      toast.success(response.message);
    },

    onError: () => {
      toast.error(
        'Não foi possível solicitar a recuperação de senha.',
      );
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: authService.resetPassword,

    onSuccess: () => {
      toast.success('Senha redefinida com sucesso.');
    },

    onError: () => {
      toast.error(
        'Não foi possível redefinir a senha.',
      );
    },
  });

  return {
    registerMutation,
    loginMutation,
    logoutMutation,
    changePasswordMutation,
    forgotPasswordMutation,
    resetPasswordMutation,
  };
}