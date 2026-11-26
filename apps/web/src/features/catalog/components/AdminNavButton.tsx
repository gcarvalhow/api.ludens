'use client';

import Link from 'next/link';

import { ShieldCheck } from 'lucide-react';

import { useCurrentUser } from '@account';

import { Button } from '@components/ui/button';

export function AdminNavButton() {
  const { data: user } = useCurrentUser();

  if (!user?.is_admin) {
    return null;
  }

  return (
    <Button
      type="button"
      size="sm"
      className="min-h-9 px-3 shadow-sm"
      asChild
    >
      <Link href="/admin">
        <ShieldCheck />
        <span className="hidden sm:inline">
          Painel administrativo
        </span>
      </Link>
    </Button>
  );
}
