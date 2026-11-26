'use client';

import Link from 'next/link';
import { Ticket } from 'lucide-react';
import { Button } from '@components/ui/button';
import { useCurrentUser } from '@account/hooks/queries/useAccountQueries';

export function ReservationsNavButton() {
  const { data: user } = useCurrentUser();
  if (user?.is_admin) return null;
  return (
    <Button variant="outline" size="sm" asChild>
      <Link href="/minhas-reservas">
        <Ticket />
        <span>Minhas reservas</span>
      </Link>
    </Button>
  );
}
