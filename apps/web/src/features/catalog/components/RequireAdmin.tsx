'use client';

import { useEffect, type ReactNode } from 'react';

import { useRouter } from 'next/navigation';

import {
  RequireAuth,
  useCurrentUser,
} from '@account';

import { Skeleton } from '@components/ui/skeleton';

interface RequireAdminProps {
  children: ReactNode;
}

function AdminGate({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();

  const {
    data: user,
    isLoading,
  } = useCurrentUser();

  useEffect(() => {
    if (
      !isLoading &&
      user &&
      !user.is_admin
    ) {
      router.replace('/');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <main className="mx-auto max-w-4xl space-y-6 p-6">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </main>
    );
  }

  if (!user || !user.is_admin) {
    return null;
  }

  return <>{children}</>;
}

export function RequireAdmin({
  children,
}: RequireAdminProps) {
  return (
    <RequireAuth>
      <AdminGate>
        {children}
      </AdminGate>
    </RequireAuth>
  );
}
