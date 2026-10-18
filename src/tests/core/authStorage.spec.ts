
import {
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import {
  createSession,
  isSessionExpired,
  loadStoredSession,
  saveStoredSession,
} from '@/services/authStorage';

import type {
  AuthSession,
  AuthTokenClaims,
} from '@/features/auth/types';

const STORAGE_KEY = 'flowdesk.auth.session';

function createTestToken(
  claims: object,
): string {
  const header = btoa(
    JSON.stringify({
      alg: 'HS256',
      typ: 'JWT',
    }),
  );

  const payload = btoa(
    JSON.stringify(claims),
  );

  return `${header}.${payload}.firma-simulada`;
}

function createTestSession(
  claims: AuthTokenClaims,
): AuthSession {
  return {
    accessToken: createTestToken(claims),
    tokenType: 'bearer',
    claims,
  };
}

const futureExpiration = () =>
  Math.floor(Date.now() / 1000) + 3600;

const pastExpiration = () =>
  Math.floor(Date.now() / 1000) - 3600;

describe('Almacenamiento seguro de sesiones', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('detecta una sesión expirada', () => {
    const session = createTestSession({
      sub: 'usuario-prueba',
      exp: pastExpiration(),
    });

    expect(isSessionExpired(session)).toBe(true);
  });

  it('mantiene como válida una sesión vigente', () => {
    const session = createTestSession({
      sub: 'usuario-prueba',
      role: 'employee',
      exp: futureExpiration(),
    });

    expect(isSessionExpired(session)).toBe(false);
  });

  it('rechaza una sesión sin expiración', () => {
    const session = createTestSession({
      sub: 'usuario-prueba',
    });

    expect(isSessionExpired(session)).toBe(true);
  });

  it('rechaza tokens malformados', () => {
    const session: AuthSession = {
      accessToken: 'token-invalido',
      tokenType: 'bearer',
      claims: null,
    };

    expect(isSessionExpired(session)).toBe(true);
  });

  it('elimina una sesión expirada almacenada', () => {
    const session = createTestSession({
      sub: 'usuario-prueba',
      exp: pastExpiration(),
    });

    saveStoredSession(session);

    expect(loadStoredSession()).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('recupera una sesión vigente desde el JWT', () => {
    const claims: AuthTokenClaims = {
      sub: 'usuario-prueba',
      role: 'admin',
      company_id: '25',
      schema_name: 'empresa_demo',
      exp: futureExpiration(),
    };

    const session = createTestSession(claims);

    saveStoredSession(session);

    const storedSession = loadStoredSession();

    expect(storedSession).not.toBeNull();
    expect(storedSession?.claims?.role).toBe('admin');
    expect(storedSession?.claims?.company_id).toBe('25');
    expect(storedSession?.claims?.schema_name).toBe('empresa_demo');
  });

  it('ignora claims manipulados en localStorage', () => {
    const token = createTestToken({
      sub: 'usuario-prueba',
      role: 'employee',
      company_id: '25',
      exp: futureExpiration(),
    });

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        accessToken: token,
        tokenType: 'bearer',
        claims: {
          sub: 'usuario-prueba',
          role: 'superadmin',
          company_id: '999',
          exp: futureExpiration(),
        },
      }),
    );

    const session = loadStoredSession();

    expect(session?.claims?.role).toBe('employee');
    expect(session?.claims?.company_id).toBe('25');
  });

  it('rechaza un token sin identificador de usuario', () => {
    const token = createTestToken({
      role: 'admin',
      exp: futureExpiration(),
    });

    const session = createSession({
      access_token: token,
      token_type: 'bearer',
    });

    expect(isSessionExpired(session)).toBe(true);
  });

  it('crea una sesión desde los claims del JWT', () => {
    const expiration = futureExpiration();

    const token = createTestToken({
      sub: 'usuario-prueba',
      role: 'manager',
      exp: expiration,
    });

    const session = createSession({
      access_token: token,
      token_type: 'bearer',
    });

    expect(session.claims?.exp).toBe(expiration);
    expect(session.claims?.role).toBe('manager');
    expect(isSessionExpired(session)).toBe(false);
  });
});
