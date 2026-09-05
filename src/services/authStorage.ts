import type {
  AuthSession,
  AuthTokenClaims,
  TokenResponse,
} from '@/features/auth/types';

const AUTH_STORAGE_KEY = 'flowdesk.auth.session';

function decodeJwtPayload(
  token: string,
): AuthTokenClaims | null {
  const [, payload] = token.split('.');

  if (!payload) {
    return null;
  }

  try {
    const normalizedPayload = payload
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(
        Math.ceil(payload.length / 4) * 4,
        '=',
      );

    const decodedPayload =
      atob(normalizedPayload);

    return JSON.parse(
      decodedPayload,
    ) as AuthTokenClaims;
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

  const exp = session.claims?.exp;

  if (typeof exp !== 'number') {
    return false;
  }

  const currentTime =
    Math.floor(Date.now() / 1000);

  return exp <= currentTime;
}

export function createSession(
  tokenResponse: TokenResponse,
): AuthSession {
  return {
    accessToken:
      tokenResponse.access_token,

    tokenType:
      tokenResponse.token_type,

    claims:
      decodeJwtPayload(
        tokenResponse.access_token,
      ),
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

export function loadStoredSession():
  AuthSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawSession =
    localStorage.getItem(
      AUTH_STORAGE_KEY,
    );

  if (!rawSession) {
    return null;
  }

  try {
    const parsedSession =
      JSON.parse(rawSession) as Partial<
        AuthSession & TokenResponse
      >;

    let session: AuthSession | null =
      null;

    if (
      typeof parsedSession.accessToken ===
      'string'
    ) {
      session = {
        accessToken:
          parsedSession.accessToken,

        tokenType:
          parsedSession.tokenType ??
          'bearer',

        claims:
          parsedSession.claims ??
          decodeJwtPayload(
            parsedSession.accessToken,
          ),
      };
    } else if (
      typeof parsedSession.access_token ===
      'string'
    ) {
      session = createSession(
        parsedSession as TokenResponse,
      );
    }

    if (
      session &&
      isSessionExpired(session)
    ) {
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
  localStorage.removeItem(
    AUTH_STORAGE_KEY,
  );
}