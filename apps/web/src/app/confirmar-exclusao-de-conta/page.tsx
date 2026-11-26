import type { Metadata } from 'next';
import { AuthShell } from '@account/components/ui';
import { AccountConfirmation } from '@account/components/AccountConfirmation';

export const metadata: Metadata = { robots: { index: false, follow: false }, referrer: 'no-referrer' };

export default async function ConfirmDeletionPage({ searchParams }: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  return <AuthShell title="Confirmar exclusão da conta">
    <AccountConfirmation kind="deletion" token={typeof params.token === 'string' ? params.token : ''} />
  </AuthShell>;
}
