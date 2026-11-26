import { ApiError } from '@web/lib/fetcher';

export function accountErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    if (error.status === 410) return 'Este link expirou, é inválido ou já foi utilizado. Solicite um novo link em Minha conta.';
    if (error.status === 401) return 'Sua sessão expirou. Entre novamente para continuar.';
    const data = error.data as { detail?: unknown } | undefined;
    if (error.status < 500 && typeof data?.detail === 'string') return data.detail;
  }
  return fallback;
}
