
import type {
  AuthSession,
  AuthTokenClaims,
  TokenResponse,
} from '@/features/auth/types';

const AUTH_STORAGE_KEY = 'flowdesk.auth.session';

function decodeJwtPayload(token: string): AuthTokenClaims | null {
  const parts = token.split('.');

  if (parts.length !== 3 || parts.some((part) => !part)) {
    return null;
  }

  try {
    const payload = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const normalizedPayload = payload.padEnd(
      Math.ceil(payload.length / 4) * 4,
      '=',
    );

    const decoded = JSON.parse(
      atob(normalizedPayload),
    ) as unknown;

    if (
      !decoded ||
      typeof decoded !== 'object' ||
      Array.isArray(decoded)
    ) {
      return null;
    }

    const claims = decoded as Record<string, unknown>;

    if (
      typeof claims.sub !== 'string' ||
      !claims.sub.trim() ||
      typeof claims.exp !== 'number' ||
      !Number.isFinite(claims.exp)
    ) {
      return null;
    }

    return claims as unknown as AuthTokenClaims;
  } catch {
    return null;
  }
}

export function isSessionExpired(
  session: AuthSession | null,
): boolean {
  if (!session?.accessToken) {
    return true;
  }

  const claims = decodeJwtPayload(session.accessToken);

  if (!claims) {
    return true;
  }

  return claims.exp! <= Math.floor(Date.now() / 1000);
}

export function createSession(
  tokenResponse: TokenResponse,
): AuthSession {
  return {
    accessToken: tokenResponse.access_token,
    tokenType: tokenResponse.token_type,
    claims: decodeJwtPayload(tokenResponse.access_token),
  };
}

export function saveStoredSession(
  session: AuthSession,
): void {
  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify(session),
  );
}

export function loadStoredSession(): AuthSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawSession = localStorage.getItem(AUTH_STORAGE_KEY);

  if (!rawSession) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawSession) as Record<string, unknown>;

    if (!parsed || typeof parsed !== 'object') {
      clearStoredSession();
      return null;
    }

    const accessToken =
      typeof parsed.accessToken === 'string'
        ? parsed.accessToken
        : typeof parsed.access_token === 'string'
          ? parsed.access_token
          : null;

    if (!accessToken) {
      clearStoredSession();
      return null;
    }

    const tokenType =
      typeof parsed.tokenType === 'string'
        ? parsed.tokenType
        : typeof parsed.token_type === 'string'
          ? parsed.token_type
          : 'bearer';

    const session: AuthSession = {
      accessToken,
      tokenType,
      claims: decodeJwtPayload(accessToken),
    };

    if (isSessionExpired(session)) {
      clearStoredSession();
      return null;
    }

    return session;
  } catch {
    clearStoredSession();
    return null;
  }
}

export function clearStoredSession(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}
