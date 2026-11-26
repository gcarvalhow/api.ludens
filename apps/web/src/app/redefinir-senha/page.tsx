import { Suspense } from 'react';

import { AuthShell } from '@account/components/ui';
import { ResetPasswordFormContainer } from '@account/components';

export default function ResetPasswordPage() {
  return (
    <AuthShell title="Redefinir senha" description="Digite sua nova senha">
      <Suspense fallback={null}>
        <ResetPasswordFormContainer />
      </Suspense>
    </AuthShell>
  );
}
