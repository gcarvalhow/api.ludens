import { loginUrl, safeReturnTo } from './navigation';

describe('destino após autenticação', () => {
  it('preserva caminho, filtros e fragmento internos', () => {
    const destination = '/minha-conta?tab=seguranca#senha';
    expect(safeReturnTo(destination)).toBe(destination);
    expect(loginUrl(destination)).toBe('/login?returnTo=%2Fminha-conta%3Ftab%3Dseguranca%23senha');
  });
  it.each(['https://evil.example', '//evil.example', '/\\\\evil.example', '/%2f%2fevil.example',
    '/%5cevil.example', '/%0aevil', '/login?returnTo=/', '/registro', '/%zz', 'javascript:alert(1)',
    '/safe/..//evil.example', '/%2e%2e//evil.example', '/%6cogin?returnTo=/'])(
    'recusa redirecionamento inseguro ou circular: %s', (value) => {
      expect(safeReturnTo(value)).toBe('/');
    },
  );
});
