import { ApiError } from '@web/lib/fetcher';

export function apiErrorStatus(
  error: unknown,
): number | undefined {
  return error instanceof ApiError
    ? error.status
    : undefined;
}

export function apiErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (error instanceof ApiError) {
    const detail = (
      error.data as { detail?: unknown } | undefined
    )?.detail;

    if (
      typeof detail === 'string' &&
      detail.trim() !== ''
    ) {
      return detail;
    }

    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0] as {
        message?: unknown;
      };

      if (typeof first?.message === 'string') {
        return first.message;
      }
    }
  }

  return fallback;
}