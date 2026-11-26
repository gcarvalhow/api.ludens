type AccessTokenClaims = {
  sub?: string;
};

/**
 * Lê o claim `sub` (id do comprador) do access token, sem verificar a
 * assinatura — a verificação é sempre responsabilidade do backend. É assim
 * que o frontend sabe o próprio id sem precisar de um `GET /auth/me`.
 */
export function decodeAccessTokenSub(token: string): string | null {
  try {
    const payloadSegment = token.split('.')[1];

    if (!payloadSegment) {
      return null;
    }

    const normalized = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      '=',
    );

    const decoded = decodeURIComponent(
      atob(padded)
        .split('')
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    );

    const claims = JSON.parse(decoded) as AccessTokenClaims;

    return claims.sub ?? null;
  } catch {
    return null;
  }
}
