import { AuthShell } from '@account/components/ui';
import { RegisterFormContainer } from '@account/components';

export default async function RegisterPage({ searchParams }: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const params = await searchParams;
  return (
    <AuthShell title="Criar conta" description="Cadastre-se para continuar">
      <RegisterFormContainer returnTo={params.returnTo ?? '/'} />
    </AuthShell>
  );
}
