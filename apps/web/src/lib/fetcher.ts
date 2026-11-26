import { endpoints } from '@web/routes/endpoints';
import { loginUrl } from '@account/lib/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

let accessToken: string | null = null;
let sessionGeneration = 0;
let pendingRefresh: { generation: number; promise: Promise<string | null> } | null = null;
const tokenListeners = new Set<() => void>();

export function subscribeAccessToken(listener: () => void) {
  tokenListeners.add(listener);
  return () => { tokenListeners.delete(listener); };
}

export function getAccessToken() {
  return accessToken;
}

export function getSessionGeneration() {
  return sessionGeneration;
}

function publishToken(token: string | null) {
  accessToken = token;
  tokenListeners.forEach((listener) => listener());
}

export function setAccessToken(token: string | null) {
  sessionGeneration++;
  publishToken(token);
}

export function clearAccessToken() {
  setAccessToken(null);
}

type FetcherOptions = RequestInit & {
  skipAuth?: boolean;
  skipRefresh?: boolean;
};

type TokenResponse = {
  access_token: string;
  expires_in: number;
};

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, data: unknown) {
    super(`HTTP ${status}`);

    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const generation = sessionGeneration;
  try {
    const response = await fetch(
      `${API_BASE_URL}${endpoints.auth.refresh}`,
      {
        method: 'POST',
        credentials: 'include',
      },
    );

    if (!response.ok) {
      if (generation === sessionGeneration) publishToken(null);
      return null;
    }

    const data = (await response.json()) as TokenResponse;

    if (generation !== sessionGeneration) return null;

    publishToken(data.access_token);

    return data.access_token;
  } catch {
    if (generation === sessionGeneration) publishToken(null);
    return null;
  }
}

function refreshAccessTokenOnce(): Promise<string | null> {
  if (pendingRefresh?.generation === sessionGeneration) return pendingRefresh.promise;
  const promise = refreshAccessToken().finally(() => {
    if (pendingRefresh?.promise === promise) pendingRefresh = null;
  });
  pendingRefresh = { generation: sessionGeneration, promise };
  return promise;
}

export async function fetcher<T>(
  path: string,
  options: FetcherOptions = {},
): Promise<T> {
  const generation = sessionGeneration;
  const {
    skipAuth = false,
    skipRefresh = false,
    headers,
    ...requestOptions
  } = options;

  const requestHeaders = new Headers(headers);

  if (!requestHeaders.has('Content-Type') && requestOptions.body) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  if (!skipAuth && accessToken) {
    requestHeaders.set(
      'Authorization',
      `Bearer ${accessToken}`,
    );
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...requestOptions,
    headers: requestHeaders,
    credentials: 'include',
  });

  if (
    response.status === 401 &&
    !skipAuth &&
    !skipRefresh &&
    path !== endpoints.auth.refresh
  ) {
    if (generation !== sessionGeneration) return handleResponse<T>(response);
    const newAccessToken = await refreshAccessTokenOnce();

    if (generation !== sessionGeneration) return handleResponse<T>(response);

    if (newAccessToken) {
      requestHeaders.set(
        'Authorization',
        `Bearer ${newAccessToken}`,
      );

      const retryResponse = await fetch(`${API_BASE_URL}${path}`, {
        ...requestOptions,
        headers: requestHeaders,
        credentials: 'include',
      });

      return handleResponse<T>(retryResponse);
    }

    if (typeof window !== 'undefined') {
      window.location.assign(loginUrl(`${window.location.pathname}${window.location.search}${window.location.hash}`));
    }
  }

  return handleResponse<T>(response);
}

async function handleResponse<T>(
  response: Response,
): Promise<T> {
  if (!response.ok) {
    const data = await response
      .json()
      .catch(() => undefined);

    throw new ApiError(response.status, data);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
