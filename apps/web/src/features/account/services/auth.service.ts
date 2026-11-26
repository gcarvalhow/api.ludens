import { fetcher } from '@web/lib/fetcher';
import { endpoints } from '@web/routes/endpoints';

import type {
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  TokenResponse,
  User,
  UpdateProfileRequest,
  EmailChangeRequest,
  MessageResponse,
} from '@account/server/types/auth.types';

export const authService = {
  updateProfile(data: UpdateProfileRequest) {
    return fetcher<User>(endpoints.users.profile, {
      method: 'PATCH', body: JSON.stringify(data),
    });
  },

  requestEmailChange(data: EmailChangeRequest) {
    return fetcher<MessageResponse>(endpoints.users.emailChange, {
      method: 'POST', body: JSON.stringify(data),
    });
  },

  confirmEmailChange(token: string) {
    return fetcher<void>(`${endpoints.users.emailChange}?token=${encodeURIComponent(token)}`, {
      method: 'PATCH', skipAuth: true,
    });
  },

  requestAccountDeletion() {
    return fetcher<MessageResponse>(endpoints.users.deletion, { method: 'POST' });
  },

  confirmAccountDeletion(token: string) {
    return fetcher<void>(`${endpoints.users.deletion}?token=${encodeURIComponent(token)}`, {
      method: 'DELETE', skipAuth: true,
    });
  },

  register(data: RegisterRequest) {
    return fetcher<TokenResponse>(endpoints.users.register, {
      method: 'POST',
      body: JSON.stringify(data),
      skipAuth: true,
    });
  },

  login(data: LoginRequest) {
    return fetcher<TokenResponse>(endpoints.auth.login, {
      method: 'POST',
      body: JSON.stringify(data),
      skipAuth: true,
    });
  },

  refresh() {
    return fetcher<TokenResponse>(endpoints.auth.refresh, {
      method: 'POST',
      skipAuth: true,
      skipRefresh: true,
    });
  },

  logout() {
    return fetcher<void>(endpoints.auth.logout, {
      method: 'POST',
    });
  },

  fetchUserById(id: string) {
    return fetcher<User>(endpoints.users.byId(id), {
      method: 'GET',
    });
  },

  changePassword(data: ChangePasswordRequest) {
    return fetcher<void>(endpoints.auth.changePassword, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  forgotPassword(data: ForgotPasswordRequest) {
    return fetcher<{ message: string }>(
      endpoints.auth.passwordForgot,
      {
        method: 'POST',
        body: JSON.stringify(data),
        skipAuth: true,
      },
    );
  },

  resetPassword(data: ResetPasswordRequest) {
    return fetcher<void>(endpoints.auth.passwordReset, {
      method: 'POST',
      body: JSON.stringify(data),
      skipAuth: true,
    });
  },
};
