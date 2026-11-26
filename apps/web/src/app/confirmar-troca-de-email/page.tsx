import type { Metadata } from 'next';
import { AuthShell } from '@account/components/ui';
import { AccountConfirmation } from '@account/components/AccountConfirmation';

export const metadata: Metadata = { robots: { index: false, follow: false }, referrer: 'no-referrer' };

export default async function ConfirmEmailPage({ searchParams }: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  return <AuthShell title="Confirmar troca de e-mail">
    <AccountConfirmation kind="email" token={typeof params.token === 'string' ? params.token : ''} />
  </AuthShell>;
}
