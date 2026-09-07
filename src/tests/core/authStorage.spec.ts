import {
  describe,
  it,
  expect,
  beforeEach,
} from "vitest";

import {
  createSession,
  isSessionExpired,
  loadStoredSession,
  saveStoredSession,
} from "@/services/authStorage";

import type {
  AuthSession,
} from "@/features/auth/types";

const STORAGE_KEY =
  "flowdesk.auth.session";

describe("authStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("detecta una sesión expirada", () => {
    const session: AuthSession = {
      accessToken: "token-expirado",
      tokenType: "bearer",
      claims: {
        sub: "prueba",
        exp:
          Math.floor(
            Date.now() / 1000,
          ) - 3600,
      },
    };

    expect(
      isSessionExpired(session),
    ).toBe(true);
  });

  it("mantiene como válida una sesión que no ha expirado", () => {
    const session: AuthSession = {
      accessToken: "token-vigente",
      tokenType: "bearer",
      claims: {
        sub: "prueba",
        exp:
          Math.floor(
            Date.now() / 1000,
          ) + 3600,
      },
    };

    expect(
      isSessionExpired(session),
    ).toBe(false);
  });

  it("no considera expirada una sesión sin claim exp", () => {
    const session: AuthSession = {
      accessToken: "token-sin-exp",
      tokenType: "bearer",
      claims: {
        sub: "prueba",
      },
    };

    expect(
      isSessionExpired(session),
    ).toBe(false);
  });

  it("elimina una sesión expirada almacenada", () => {
    const session: AuthSession = {
      accessToken: "token-expirado",
      tokenType: "bearer",
      claims: {
        sub: "prueba",
        exp:
          Math.floor(
            Date.now() / 1000,
          ) - 3600,
      },
    };

    saveStoredSession(session);

    expect(
      loadStoredSession(),
    ).toBeNull();

    expect(
      localStorage.getItem(
        STORAGE_KEY,
      ),
    ).toBeNull();
  });

  it("recupera una sesión almacenada que sigue vigente", () => {
    const session: AuthSession = {
      accessToken: "token-vigente",
      tokenType: "bearer",
      claims: {
        sub: "prueba",
        role: "admin",
        exp:
          Math.floor(
            Date.now() / 1000,
          ) + 3600,
      },
    };

    saveStoredSession(session);

    const storedSession =
      loadStoredSession();

    expect(
      storedSession,
    ).not.toBeNull();

    expect(
      storedSession?.accessToken,
    ).toBe("token-vigente");

    expect(
      storedSession?.claims?.role,
    ).toBe("admin");
  });

  it("crea una sesión a partir de un JWT con exp", () => {
    const header = btoa(
      JSON.stringify({
        alg: "none",
        typ: "JWT",
      }),
    );

    const expiration =
      Math.floor(
        Date.now() / 1000,
      ) + 3600;

    const payload = btoa(
      JSON.stringify({
        sub: "prueba",
        role: "admin",
        exp: expiration,
      }),
    );

    const session =
      createSession({
        access_token:
          `${header}.${payload}.firma-falsa`,
        token_type: "bearer",
      });

    expect(
      session.claims?.exp,
    ).toBe(expiration);

    expect(
      session.claims?.role,
    ).toBe("admin");
  });
});