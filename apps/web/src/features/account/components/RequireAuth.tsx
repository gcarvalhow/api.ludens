'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@account/contexts/AuthContext';
import { loginUrl } from '@account/lib/navigation';

type RequireAuthProps = {
  children: ReactNode;
};

export function RequireAuth({ children }: RequireAuthProps) {
  const router = useRouter();

  const {
    isAuthenticated,
    isLoading,
    sessionRedirect,
  } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(sessionRedirect ?? loginUrl(`${window.location.pathname}${window.location.search}${window.location.hash}`));
    }
  }, [isAuthenticated, isLoading, router, sessionRedirect]);

  if (isLoading) {
    return <p className="p-6" role="status">Verificando sua sessão...</p>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
