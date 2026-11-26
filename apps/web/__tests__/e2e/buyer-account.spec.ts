import { expect, test, type Page } from '@playwright/test';

async function buyerApi(page: Page) {
  let authenticated = false;
  let user = { id: 'buyer', name: 'Maria Demo', email: 'buyer@example.com', cpf: '52998224725', is_admin: false };
  const token = `header.${Buffer.from(JSON.stringify({ sub: user.id })).toString('base64url')}.signature`;
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();
    let status = 200;
    let body: unknown = {};
    if (path.endsWith('/authentication/login')) {
      authenticated = true;
      body = { access_token: token, expires_in: 1800 };
    } else if (path.endsWith('/authentication/refresh')) {
      status = authenticated ? 200 : 401;
      body = authenticated ? { access_token: token, expires_in: 1800 } : { detail: 'Sessão expirada.' };
    } else if (path.endsWith('/authentication/logout')) {
      authenticated = false;
      status = 204;
    } else if (path === '/api/identity/users/buyer') {
      body = user;
    } else if (path === '/api/identity/users' && method === 'PATCH') {
      user = { ...user, ...request.postDataJSON() };
      body = user;
    } else if (path.endsWith('/email/change') && method === 'POST') {
      body = { message: 'Enviamos um link de confirmação para buyer@example.com.' };
    } else if (path.endsWith('/deletion') && method === 'POST') {
      body = { message: 'Enviamos um link de confirmação para buyer@example.com.' };
    } else if (path.endsWith('/authentication/password/change')) {
      authenticated = false;
      status = 204;
    } else if (path.endsWith('/genres')) {
      body = [];
    } else if (path.endsWith('/shows')) {
      body = { items: [], total: 0, page: 1, size: 12 };
    } else if (path === '/api/booking/reservations') {
      body = { items: [], total: 0, page: 1, size: 12 };
    } else {
      status = 404;
      body = { detail: 'Recurso não encontrado.' };
    }
    await route.fulfill({ status, contentType: 'application/json', body: status === 204 ? '' : JSON.stringify(body) });
  });
}

async function signIn(page: Page) {
  await page.getByLabel('E-mail', { exact: true }).fill('buyer@example.com');
  await page.getByLabel('Senha', { exact: true }).fill('senha-demo-123');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
}

test('login retorna ao destino com filtros; perfil, e-mail, exclusão e senha são acessíveis', async ({ page }) => {
  await buyerApi(page);
  await page.goto('/minha-conta?tab=seguranca');
  await expect(page).toHaveURL(/\/login\?returnTo=%2Fminha-conta%3Ftab%3Dseguranca/);
  await signIn(page);
  await expect(page).toHaveURL('/minha-conta?tab=seguranca');
  await expect(page.getByRole('navigation')).toContainText('Olá, Maria Demo');
  await page.screenshot({ path: test.info().outputPath('buyer-account-desktop.png'), fullPage: true });
  await page.getByLabel('Nome', { exact: true }).fill('Maria Silva');
  await page.getByRole('button', { name: 'Salvar perfil' }).click();
  await expect(page.getByRole('navigation')).toContainText('Olá, Maria Silva');
  await page.getByLabel('Novo e-mail', { exact: true }).fill('novo@example.com');
  await page.getByLabel('Confirme o novo e-mail').fill('novo@example.com');
  await page.getByRole('button', { name: 'Solicitar troca de e-mail' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'buyer@example.com' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Solicitar exclusão da conta' })).toBeDisabled();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Solicitar exclusão da conta' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'continua ativa' })).toBeVisible();
  await page.getByLabel('Senha atual', { exact: true }).fill('senha-demo-123');
  await page.getByLabel('Nova senha', { exact: true }).fill('senha-nova-123');
  await page.getByRole('button', { name: 'Alterar senha', exact: true }).click();
  await expect(page).toHaveURL(/reason=password-changed/);
  await expect(page.getByRole('status').filter({ hasText: 'Todas as sessões' })).toBeVisible();
});

test('celular: navegação não transborda, funciona por teclado e oferece reservas e sair', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await buyerApi(page);
  await page.goto('/login');
  await expect(page.getByRole('link', { name: 'Entrar', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Criar conta', exact: true }).first()).toBeVisible();
  await signIn(page);
  await page.goto('/minha-conta');
  await expect(page.getByRole('link', { name: 'Minhas reservas' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: test.info().outputPath('buyer-account-mobile.png'), fullPage: true });
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Ir para o conteúdo' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#conteudo')).toBeFocused();
  await page.getByRole('link', { name: 'Minhas reservas' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Minhas reservas' })).toBeVisible();
  await expect(page.getByText('Nenhuma reserva encontrada.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Sair', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('link', { name: 'Entrar', exact: true })).toBeVisible();
});

test('confirmações são públicas, não consomem token ao abrir e tratam link inválido', async ({ page }) => {
  await buyerApi(page);
  let confirmations = 0;
  await page.route('**/api/identity/users/email/change?*', async (route) => {
    confirmations++;
    await route.fulfill({ status: 410, contentType: 'application/json', body: JSON.stringify({ detail: 'Este link não é mais válido.' }) });
  });
  await page.goto('/confirmar-troca-de-email?token=expired');
  await expect(page.getByRole('button', { name: 'Confirmar troca de e-mail' })).toBeVisible();
  expect(confirmations).toBe(0);
  await page.getByRole('button', { name: 'Confirmar troca de e-mail' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'expirou' })).toContainText('expirou, é inválido ou já foi utilizado');
  await page.goto('/confirmar-exclusao-de-conta');
  await expect(page.getByRole('alert').filter({ hasText: 'Link inválido' })).toContainText('Link inválido ou incompleto');
});

test('Entrar na navegação preserva filtros e o fragmento da página de origem', async ({ page }) => {
  await buyerApi(page);
  await page.goto('/?genre=drama#sessoes');
  await page.getByRole('navigation').getByRole('link', { name: 'Entrar', exact: true }).click();
  await signIn(page);
  await expect(page).toHaveURL('/?genre=drama#sessoes');
});
