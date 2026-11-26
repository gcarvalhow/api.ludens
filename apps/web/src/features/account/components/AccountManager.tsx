'use client';

import { Button } from '@components/ui/button';
import { Card, CardContent, CardHeader } from '@components/ui/card';
import { useCurrentUser } from '@account/hooks/queries/useAccountQueries';
import { ProfileFormContainer } from './ProfileFormContainer';
import { ChangePasswordFormContainer } from './ChangePasswordFormContainer';
import { EmailChangeFormContainer } from './EmailChangeFormContainer';
import { AccountDeletionFormContainer } from './AccountDeletionFormContainer';

export function AccountManager() {
  const query = useCurrentUser();
  if (query.isLoading) return <p role="status">Carregando seus dados...</p>;
  if (query.isError || !query.data) return <div role="alert" className="space-y-3">
    <p>Não foi possível carregar sua conta.</p>
    <Button onClick={() => void query.refetch()}>Tentar novamente</Button>
  </div>;
  const sections = [
    { title: 'Perfil', content: <ProfileFormContainer user={query.data} /> },
    { title: 'Senha', content: <ChangePasswordFormContainer /> },
    { title: 'Troca de e-mail', content: <EmailChangeFormContainer /> },
    { title: 'Exclusão da conta', content: <AccountDeletionFormContainer /> },
  ];
  return <div className="grid min-w-0 gap-6">
    {sections.map(({ title, content }) => <Card key={title}>
      <CardHeader><h2 className="text-lg font-semibold">{title}</h2></CardHeader>
      <CardContent>{content}</CardContent>
    </Card>)}
  </div>;
}
