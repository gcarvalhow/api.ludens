import { safeReturnTo } from './return-to';

describe('retorno após autenticação', () => {
  it('preserva sessão, reserva e query string locais', () => {
    expect(safeReturnTo('/sessoes/123?selection=1')).toBe('/sessoes/123?selection=1');
    expect(safeReturnTo('/checkout/123')).toBe('/checkout/123');
  });
  it.each([
    'https://evil.example',
    '//evil.example',
    '/\\evil.example',
    '/\nevil.example',
    undefined,
    ['//evil.example'],
  ])('recusa redirecionamento externo ou malformado: %s', (target) => {
    expect(safeReturnTo(target)).toBe('/');
  });
});
