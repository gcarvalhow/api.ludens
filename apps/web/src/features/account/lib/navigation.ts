export function safeReturnTo(value: string | null | undefined): string {
  if (typeof value !== 'string' || !value.startsWith('/')) return '/';
  try {
    const decoded = decodeURIComponent(value);
    if (decoded.startsWith('//') || /[\\\u0000-\u001f\u007f]/.test(decoded)) return '/';
    const url = new URL(value, 'https://ludens.local');
    const normalizedPath = decodeURIComponent(url.pathname);
    if (url.origin !== 'https://ludens.local' || normalizedPath.startsWith('//') || /^\/(login|registro)(\/|$)/i.test(normalizedPath)) return '/';
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '/';
  }
}

export function loginUrl(destination: string): string {
  return `/login?returnTo=${encodeURIComponent(safeReturnTo(destination))}`;
}
