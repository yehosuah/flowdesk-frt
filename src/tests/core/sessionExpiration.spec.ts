
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { appStore } from '@/stores/app.store';

const STORAGE_KEY = 'flowdesk.auth.session';

function createTestToken(exp: number): string {
  const header = btoa(
    JSON.stringify({
      alg: 'HS256',
      typ: 'JWT',
    }),
  );

  const payload = btoa(
    JSON.stringify({
      sub: 'usuario-prueba',
      role: 'employee',
      exp,
    }),
  );

  return `${header}.${payload}.firma-simulada`;
}

describe('Expiración automática de sesiones', () => {
  beforeEach(() => {
    vi.useFakeTimers();

    vi.setSystemTime(
      new Date('2026-10-18T12:00:00Z'),
    );

    appStore.clearSession();
    localStorage.clear();
  });

  afterEach(() => {
    appStore.clearSession();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('cierra automáticamente una sesión cuando expira', () => {
    const expiration =
      Math.floor(Date.now() / 1000) + 5;

    appStore.setSession({
      access_token: createTestToken(expiration),
      token_type: 'bearer',
    });

    expect(appStore.isAuthenticated.value).toBe(true);

    vi.advanceTimersByTime(5000);

    expect(appStore.state.session).toBeNull();
    expect(appStore.isAuthenticated.value).toBe(false);
    expect(appStore.accessToken).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('mantiene una sesión vigente antes de su expiración', () => {
    const expiration =
      Math.floor(Date.now() / 1000) + 10;

    appStore.setSession({
      access_token: createTestToken(expiration),
      token_type: 'bearer',
    });

    vi.advanceTimersByTime(5000);

    expect(appStore.isAuthenticated.value).toBe(true);
    expect(appStore.state.session).not.toBeNull();
  });

  it('no permite que un temporizador anterior cierre una sesión nueva', () => {
    const firstExpiration =
      Math.floor(Date.now() / 1000) + 5;

    appStore.setSession({
      access_token: createTestToken(firstExpiration),
      token_type: 'bearer',
    });

    vi.advanceTimersByTime(2000);

    const secondExpiration =
      Math.floor(Date.now() / 1000) + 20;

    appStore.setSession({
      access_token: createTestToken(secondExpiration),
      token_type: 'bearer',
    });

    vi.advanceTimersByTime(4000);

    expect(appStore.isAuthenticated.value).toBe(true);
    expect(appStore.state.session).not.toBeNull();
  });

  it('cancela el temporizador al cerrar sesión manualmente', () => {
    const expiration =
      Math.floor(Date.now() / 1000) + 10;

    appStore.setSession({
      access_token: createTestToken(expiration),
      token_type: 'bearer',
    });

    expect(appStore.isAuthenticated.value).toBe(true);

    const clearTimeoutSpy = vi.spyOn(
      globalThis,
      'clearTimeout',
    );

    appStore.clearSession();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    expect(appStore.state.session).toBeNull();
    expect(appStore.isAuthenticated.value).toBe(false);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();

    vi.advanceTimersByTime(15000);

    expect(appStore.state.session).toBeNull();
    expect(appStore.isAuthenticated.value).toBe(false);
  });

  it('rechaza una sesión con JWT expirado', () => {
    const expiration =
      Math.floor(Date.now() / 1000) - 10;

    appStore.setSession({
      access_token: createTestToken(expiration),
      token_type: 'bearer',
    });

    expect(appStore.isAuthenticated.value).toBe(false);
    expect(appStore.accessToken).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('permite iniciar una nueva sesión después de expirar', () => {
    const firstExpiration =
      Math.floor(Date.now() / 1000) + 5;

    appStore.setSession({
      access_token: createTestToken(firstExpiration),
      token_type: 'bearer',
    });

    vi.advanceTimersByTime(5000);

    expect(appStore.isAuthenticated.value).toBe(false);

    const secondExpiration =
      Math.floor(Date.now() / 1000) + 30;

    appStore.setSession({
      access_token: createTestToken(secondExpiration),
      token_type: 'bearer',
    });

    expect(appStore.isAuthenticated.value).toBe(true);
    expect(appStore.accessToken).not.toBeNull();
  });
});
