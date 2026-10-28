
import {
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import {
  loadStoredSession,
  clearStoredSession,
} from '@/services/authStorage';

import {
  can,
  canAccessRoute,
} from '@/utils/permissions';

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

function futureExpiration(): number {
  return Math.floor(Date.now() / 1000) + 3600;
}

function getRole(
  role: string | number | null | undefined,
): string | null {
  if (typeof role === 'string') {
    return role;
  }

  if (typeof role === 'number' && Number.isFinite(role)) {
    return String(role);
  }

  return null;
}
describe('Seguridad ante manipulación de roles', () => {
  beforeEach(() => {
    localStorage.clear();
    clearStoredSession();
  });

  it('ignora un rol administrativo manipulado en localStorage', () => {
    const token = createTestToken({
      sub: 'usuario-empleado',
      role: 'employee',
      exp: futureExpiration(),
    });

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        accessToken: token,
        tokenType: 'bearer',
        claims: {
          sub: 'usuario-empleado',
          role: 'admin',
          exp: futureExpiration(),
        },
      }),
    );

    const session = loadStoredSession();

    expect(session?.claims?.role).toBe('employee');

    expect(
      canAccessRoute(getRole(session?.claims?.role), 'reports'),
    ).toBe(false);

    expect(
      can(getRole(session?.claims?.role), 'employees.manage'),
    ).toBe(false);
  });

  it('impide que employee acceda a funciones administrativas', () => {
    expect(
      canAccessRoute('employee', 'reports'),
    ).toBe(false);

    expect(
      canAccessRoute('employee', 'superAdmin'),
    ).toBe(false);

    expect(
      can('employee', 'accounts.manage'),
    ).toBe(false);

    expect(
      can('employee', 'employees.manage'),
    ).toBe(false);
  });

  it('impide que manager acceda a SuperAdmin', () => {
    expect(
      canAccessRoute('manager', 'superAdmin'),
    ).toBe(false);

    expect(
      can('manager', 'accounts.manage'),
    ).toBe(false);
  });

  it('impide que admin acceda a funciones exclusivas de SuperAdmin', () => {
    expect(
      canAccessRoute('admin', 'superAdmin'),
    ).toBe(false);

    expect(
      can('admin', 'accounts.manage'),
    ).toBe(false);
  });

  it('rechaza roles desconocidos', () => {
    const invalidRoles = [
      'root',
      'administrator',
      'superuser',
      'owner',
      '',
    ];

    for (const role of invalidRoles) {
      expect(
        canAccessRoute(role, 'reports'),
      ).toBe(false);

      expect(
        canAccessRoute(role, 'superAdmin'),
      ).toBe(false);

      expect(
        can(role, 'accounts.manage'),
      ).toBe(false);
    }
  });

  it('rechaza permisos administrativos cuando no existe un rol', () => {
    expect(
      canAccessRoute(null, 'reports'),
    ).toBe(false);

    expect(
      canAccessRoute(undefined, 'superAdmin'),
    ).toBe(false);

    expect(
      can(null, 'accounts.manage'),
    ).toBe(false);
  });

  it('no permite elevar permisos mediante claims almacenados', () => {
    const token = createTestToken({
      sub: 'usuario-empleado',
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
          sub: 'usuario-empleado',
          role: 'superadmin',
          company_id: '999',
          exp: futureExpiration(),
        },
      }),
    );

    const session = loadStoredSession();

    expect(session?.claims?.role).toBe('employee');
    expect(session?.claims?.company_id).toBe('25');

    expect(
      canAccessRoute(getRole(session?.claims?.role), 'superAdmin'),
    ).toBe(false);
  });
});
