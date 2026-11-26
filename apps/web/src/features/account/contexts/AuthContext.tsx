'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

import {
  clearAccessToken,
  getAccessToken,
  getSessionGeneration,
  setAccessToken,
  subscribeAccessToken,
} from '@web/lib/fetcher';
import { decodeAccessTokenSub } from '@web/lib/jwt';
import { useQueryClient } from '@tanstack/react-query';

import { authService } from '@account/services/auth.service';

import type {
  LoginRequest,
} from '@account/server/types/auth.types';

type AuthContextValue = {
  userId: string | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  setSession: (token: string) => Promise<void>;
  clearSession: (destination?: string) => void;
  sessionRedirect: string | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const queryClient = useQueryClient();
  const accessToken = useSyncExternalStore(subscribeAccessToken, getAccessToken, () => null);
  const bootstrap = useRef<Promise<boolean> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionRedirect, setSessionRedirect] = useState<string | null>(null);

  const userId = useMemo(
    () => (accessToken ? decodeAccessTokenSub(accessToken) : null),
    [accessToken],
  );

  const clearSession = useCallback((destination?: string) => {
    setSessionRedirect(destination ?? null);
    clearAccessToken();
    void queryClient.cancelQueries();
    queryClient.clear();
  }, [queryClient]);

  const setSession = useCallback(async (token: string) => {
    setSessionRedirect(null);
    queryClient.clear();
    setAccessToken(token);
  }, [queryClient]);

  const refreshSession = useCallback(async () => {
    const generation = getSessionGeneration();
    try {
      const response = await authService.refresh();

      if (getSessionGeneration() !== generation) return Boolean(getAccessToken());

      await setSession(response.access_token);

      return true;
    } catch {
      if (getSessionGeneration() === generation) clearSession();

      return Boolean(getAccessToken());
    }
  }, [setSession, clearSession]);

  const login = useCallback(
    async (data: LoginRequest) => {
      const response = await authService.login(data);

      await setSession(response.access_token);
    },
    [setSession],
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      clearSession('/');
    }
  }, [clearSession]);

  useEffect(() => {
    async function bootstrapAuth() {
      try {
        bootstrap.current ??= refreshSession();
        await bootstrap.current;
      } finally {
        setIsLoading(false);
      }
    }

    void bootstrapAuth();
  }, [refreshSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      userId,
      accessToken,
      isAuthenticated: Boolean(accessToken && userId),
      isLoading,
      login,
      logout,
      refreshSession,
      setSession,
      clearSession,
      sessionRedirect,
    }),
    [
      userId,
      accessToken,
      isLoading,
      login,
      logout,
      refreshSession,
      setSession,
      clearSession,
      sessionRedirect,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth deve ser usado dentro de AuthProvider.',
    );
  }

  return context;
}
