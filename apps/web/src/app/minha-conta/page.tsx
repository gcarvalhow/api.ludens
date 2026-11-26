import { RequireAuth } from '@account/components/RequireAuth';
import { AccountManager } from '@account/components/AccountManager';

export default function AccountPage() {
  return <RequireAuth><main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8">
    <h1 className="text-2xl font-semibold">Minha conta</h1>
    <AccountManager />
  </main></RequireAuth>;
}
