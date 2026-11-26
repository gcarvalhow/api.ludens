import { AuthShell } from '@account/components/ui';
import { ForgotPasswordFormContainer } from '@account/components';

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Recuperar senha"
      description="Informe seu e-mail para receber as instruções"
    >
      <ForgotPasswordFormContainer />
    </AuthShell>
  );
}
