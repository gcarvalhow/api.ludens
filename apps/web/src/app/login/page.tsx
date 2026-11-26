import { AuthShell } from '@account/components/ui';
import { LoginFormContainer } from '@account/components';

export default async function LoginPage({ searchParams }: {
  searchParams: Promise<{ returnTo?: string; reason?: string }>;
}) {
  const params = await searchParams;
  return (
    <AuthShell title="Entrar" description="Acesse sua conta">
      {params.reason === 'password-changed' ? <p role="status" className="mb-4 text-sm">Senha alterada. Todas as sessões foram encerradas. Entre com a nova senha.</p> : null}
      <LoginFormContainer returnTo={params.returnTo ?? '/'} />
    </AuthShell>
  );
}
