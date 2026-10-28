
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { appStore } from '@/stores/app.store';

import {
  can,
  canAccessRoute,
} from '@/utils/permissions';

import {
  loadStoredSession,
  saveStoredSession,
} from '@/services/authStorage';

import type {
  AuthSession,
} from '@/features/auth/types';

const STORAGE_KEY = 'flowdesk.auth.session';

function createTestToken(
  role: string,
  expiration: number,
): string {
  const header = btoa(
    JSON.stringify({
      alg: 'HS256',
      typ: 'JWT',
    }),
  );

  const payload = btoa(
    JSON.stringify({
      sub: 'usuario-prueba',
      role,
      company_id: '25',
      schema_name: 'empresa_demo',
      exp: expiration,
    }),
  );

  return `${header}.${payload}.firma-simulada`;
}

function createTestSession(
  role: string,
  expiration: number,
): AuthSession {
  return {
    accessToken: createTestToken(
      role,
      expiration,
    ),
    tokenType: 'bearer',
    claims: {
      sub: 'usuario-prueba',
      role,
      company_id: '25',
      schema_name: 'empresa_demo',
      exp: expiration,
    },
  };
}

function futureExpiration(
  seconds = 3600,
): number {
  return Math.floor(Date.now() / 1000) + seconds;
}

describe('SCRUM-807: Integración de sesión y roles', () => {
  beforeEach(() => {
    vi.useFakeTimers();

    vi.setSystemTime(
      new Date('2026-10-26T12:00:00Z'),
    );

    appStore.clearSession();
    localStorage.clear();
  });

  afterEach(() => {
    appStore.clearSession();
    localStorage.clear();

    vi.useRealTimers();
  });

  it('establece una sesión y obtiene el rol desde el JWT', () => {
    appStore.setSession({
      access_token: createTestToken(
        'admin',
        futureExpiration(),
      ),
      token_type: 'bearer',
    });

    expect(appStore.isAuthenticated.value).toBe(true);
    expect(appStore.roleName.value).toBe('admin');
    expect(appStore.companyId.value).toBe('25');
    expect(appStore.schemaName.value).toBe('empresa_demo');
  });

  it('permite acceder a funcionalidades autorizadas según el rol', () => {
    appStore.setSession({
      access_token: createTestToken(
        'manager',
        futureExpiration(),
      ),
      token_type: 'bearer',
    });

    const role = appStore.roleName.value;

    expect(canAccessRoute(role, 'inventory')).toBe(true);
    expect(canAccessRoute(role, 'analytics')).toBe(true);
    expect(canAccessRoute(role, 'reports')).toBe(false);
    expect(canAccessRoute(role, 'superAdmin')).toBe(false);
  });

  it('impide que employee utilice permisos administrativos', () => {
    appStore.setSession({
      access_token: createTestToken(
        'employee',
        futureExpiration(),
      ),
      token_type: 'bearer',
    });

    const role = appStore.roleName.value;

    expect(can(role, 'inventory.view')).toBe(true);
    expect(can(role, 'sales.create')).toBe(true);
    expect(can(role, 'employees.manage')).toBe(false);
    expect(can(role, 'accounts.manage')).toBe(false);
  });

  it('actualiza los permisos cuando cambia la sesión', () => {
    appStore.setSession({
      access_token: createTestToken(
        'employee',
        futureExpiration(),
      ),
      token_type: 'bearer',
    });

    expect(
      canAccessRoute(appStore.roleName.value, 'reports'),
    ).toBe(false);

    appStore.setSession({
      access_token: createTestToken(
        'admin',
        futureExpiration(),
      ),
      token_type: 'bearer',
    });

    expect(appStore.roleName.value).toBe('admin');

    expect(
      canAccessRoute(appStore.roleName.value, 'reports'),
    ).toBe(true);
  });

  it('recupera una sesión vigente desde localStorage', () => {
    const session = createTestSession(
      'manager',
      futureExpiration(),
    );

    saveStoredSession(session);

    const recoveredSession = loadStoredSession();

    expect(recoveredSession).not.toBeNull();
    expect(recoveredSession?.claims?.role).toBe('manager');
    expect(recoveredSession?.claims?.company_id).toBe('25');
  });

  it('rechaza una sesión almacenada que ya expiró', () => {
    const session = createTestSession(
      'admin',
      futureExpiration(-60),
    );

    saveStoredSession(session);

    expect(loadStoredSession()).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('elimina los permisos al cerrar sesión', () => {
    appStore.setSession({
      access_token: createTestToken(
        'admin',
        futureExpiration(),
      ),
      token_type: 'bearer',
    });

    expect(
      canAccessRoute(appStore.roleName.value, 'reports'),
    ).toBe(true);

    appStore.clearSession();

    expect(appStore.isAuthenticated.value).toBe(false);
    expect(appStore.roleName.value).toBeNull();
    expect(appStore.accessToken).toBeNull();

    expect(
      canAccessRoute(appStore.roleName.value, 'reports'),
    ).toBe(false);
  });

  it('revoca los permisos cuando expira el JWT', () => {
    appStore.setSession({
      access_token: createTestToken(
        'admin',
        futureExpiration(5),
      ),
      token_type: 'bearer',
    });

    expect(appStore.isAuthenticated.value).toBe(true);

    vi.advanceTimersByTime(5000);

    expect(appStore.isAuthenticated.value).toBe(false);
    expect(appStore.roleName.value).toBeNull();

    expect(
      canAccessRoute(appStore.roleName.value, 'reports'),
    ).toBe(false);
  });

  it('ignora claims administrativos manipulados en localStorage', () => {
    const token = createTestToken(
      'employee',
      futureExpiration(),
    );

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

    const recoveredSession = loadStoredSession();

    expect(recoveredSession?.claims?.role).toBe('employee');
    expect(recoveredSession?.claims?.company_id).toBe('25');

    const role = recoveredSession?.claims?.role;
    const normalizedRole =
      role === null || role === undefined
        ? null
        : String(role);

    expect(
      canAccessRoute(normalizedRole, 'superAdmin'),
    ).toBe(false);
  });
});
