import { clearAccessToken, fetcher, getAccessToken, setAccessToken } from './fetcher';

const originalFetch = global.fetch;

function jsonResponse(body: unknown, init: Partial<Response> = {}) {
  return {
    ok: true,
    status: 200,
    json: async () => body,
    ...init,
  } as Response;
}

describe('fetcher', () => {
  beforeEach(() => {
    clearAccessToken();
    global.fetch = jest.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('compartilha uma renovação entre requisições simultâneas sem reutilizar o refresh token', async () => {
    setAccessToken('old');
    let finishRefresh!: (value: Response) => void;
    const refreshing = new Promise<Response>((resolve) => { finishRefresh = resolve; });
    let refreshCalls = 0;
    (global.fetch as jest.Mock).mockImplementation((url: string, options: RequestInit) => {
      if (url.endsWith('/refresh')) { refreshCalls++; return refreshing; }
      return Promise.resolve((options.headers as Headers).get('Authorization') === 'Bearer new'
        ? jsonResponse({ ok: true })
        : jsonResponse({}, { ok: false, status: 401 }));
    });
    const first = fetcher('/users/first');
    const second = fetcher('/users/second');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(refreshCalls).toBe(1);
    finishRefresh(jsonResponse({ access_token: 'new', expires_in: 1800 }));
    expect(await Promise.all([first, second])).toEqual([{ ok: true }, { ok: true }]);
    expect(getAccessToken()).toBe('new');
  });

  it('uma renovação atrasada não restaura a sessão depois de sair', async () => {
    setAccessToken('old');
    let finishRefresh!: (value: Response) => void;
    const refreshing = new Promise<Response>((resolve) => { finishRefresh = resolve; });
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(jsonResponse({}, { ok: false, status: 401 }))
      .mockReturnValueOnce(refreshing);
    const request = fetcher('/users/first');
    const rejected = expect(request).rejects.toThrow('HTTP 401');
    await new Promise((resolve) => setTimeout(resolve, 0));
    clearAccessToken();
    finishRefresh(jsonResponse({ access_token: 'stale', expires_in: 1800 }));
    await rejected;
    expect(getAccessToken()).toBeNull();
  });

  it('uma renovação antiga que falha não encerra nem reutiliza um login mais recente', async () => {
    setAccessToken('old');
    let finishRefresh!: (value: Response) => void;
    const refreshing = new Promise<Response>((resolve) => { finishRefresh = resolve; });
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(jsonResponse({}, { ok: false, status: 401 }))
      .mockReturnValueOnce(refreshing)
      .mockResolvedValueOnce(jsonResponse({ id: 'current' }));
    const request = fetcher('/users/current');
    const rejected = expect(request).rejects.toThrow('HTTP 401');
    await new Promise((resolve) => setTimeout(resolve, 0));
    setAccessToken('new-login');
    finishRefresh(jsonResponse({}, { ok: false, status: 401 }));
    await rejected;
    expect(getAccessToken()).toBe('new-login');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('não repete uma alteração da conta anterior com as credenciais de outro comprador', async () => {
    setAccessToken('buyer-a');
    let finishRefresh!: (value: Response) => void;
    const refreshing = new Promise<Response>((resolve) => { finishRefresh = resolve; });
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(jsonResponse({}, { ok: false, status: 401 }))
      .mockReturnValueOnce(refreshing)
      .mockResolvedValueOnce(jsonResponse({ name: 'Buyer A' }));
    const request = fetcher('/api/identity/users', { method: 'PATCH', body: JSON.stringify({ name: 'Buyer A' }) });
    const rejected = expect(request).rejects.toThrow('HTTP 401');
    await new Promise((resolve) => setTimeout(resolve, 0));
    setAccessToken('buyer-b');
    finishRefresh(jsonResponse({ access_token: 'stale-a', expires_in: 1800 }));
    await rejected;
    expect(getAccessToken()).toBe('buyer-b');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('monta a URL a partir de NEXT_PUBLIC_API_URL + path', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse({ ok: true }));

    await fetcher('/users/register', { method: 'POST', body: '{}' });

    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe(`${process.env.NEXT_PUBLIC_API_URL ?? ''}/users/register`);
  });

  it('envia Authorization quando há access token e skipAuth não foi pedido', async () => {
    setAccessToken('token-123');
    (global.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse({}));

    await fetcher('/users/me');

    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    const headers = options.headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer token-123');
  });

  it('não envia Authorization quando skipAuth é true', async () => {
    setAccessToken('token-123');
    (global.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse({}));

    await fetcher('/auth/login', { skipAuth: true });

    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    const headers = options.headers as Headers;
    expect(headers.has('Authorization')).toBe(false);
  });

  it('retorna undefined em 204 sem tentar fazer parse do body', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse(undefined, { status: 204 }),
    );

    const result = await fetcher('/auth/logout', { method: 'POST' });

    expect(result).toBeUndefined();
  });

  it('propaga erro em resposta não-ok', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as Response);

    await expect(fetcher('/users/register', { method: 'POST' })).rejects.toThrow(
      'HTTP 500',
    );
  });

  it('em 401, tenta refresh e repete a chamada original com o novo token', async () => {
    (global.fetch as jest.Mock)
      // chamada original -> 401
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) } as Response)
      // refresh -> novo access_token (contrato snake_case)
      .mockResolvedValueOnce(jsonResponse({ access_token: 'novo-token', expires_in: 900 }))
      // retry da chamada original -> sucesso
      .mockResolvedValueOnce(jsonResponse({ id: '1' }));

    const result = await fetcher('/users/1');

    expect(result).toEqual({ id: '1' });
    expect(getAccessToken()).toBe('novo-token');
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it('em 401 sem refresh possível, limpa o token, propaga o erro original e tenta o refresh só uma vez', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) } as Response)
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) } as Response);

    await expect(fetcher('/users/1')).rejects.toThrow('HTTP 401');
    expect(getAccessToken()).toBeNull();
    // 1 chamada original + 1 tentativa de refresh — sem retry em loop
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
