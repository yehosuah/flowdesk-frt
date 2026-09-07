import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
} from "vitest";

vi.mock("@/services/authStorage", () => ({
  loadStoredSession: vi.fn(),
  saveStoredSession: vi.fn(),
  clearStoredSession: vi.fn(),
  createSession: vi.fn(),
  isSessionExpired: vi.fn(),
}));

import * as authStorage from "@/services/authStorage";
import { appStore } from "@/stores/app.store";

describe("appStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(
      authStorage.isSessionExpired,
    ).mockReturnValue(false);

    appStore.clearSession();

    vi.clearAllMocks();
  });

  it("inicia sin una sesión autenticada", () => {
    expect(
      appStore.isAuthenticated.value,
    ).toBe(false);

    expect(
      appStore.accessToken,
    ).toBeNull();
  });

  it("establece una sesión vigente correctamente", () => {
    vi.mocked(
      authStorage.createSession,
    ).mockReturnValue({
      accessToken: "token123",
      tokenType: "bearer",
      claims: {
        sub: "usuario-prueba",
        role: "admin",
        schema_name: "empresa",
        company_id: "1",
        exp:
          Math.floor(
            Date.now() / 1000,
          ) + 3600,
      },
    });

    vi.mocked(
      authStorage.isSessionExpired,
    ).mockReturnValue(false);

    appStore.setSession({
      access_token: "token123",
      token_type: "bearer",
    });

    expect(
      appStore.isAuthenticated.value,
    ).toBe(true);

    expect(
      appStore.accessToken,
    ).toBe("token123");

    expect(
      authStorage.saveStoredSession,
    ).toHaveBeenCalledTimes(1);
  });

  it("rechaza una sesión expirada", () => {
    vi.mocked(
      authStorage.createSession,
    ).mockReturnValue({
      accessToken: "token-expirado",
      tokenType: "bearer",
      claims: {
        sub: "usuario-prueba",
        role: "admin",
        exp:
          Math.floor(
            Date.now() / 1000,
          ) - 3600,
      },
    });

    vi.mocked(
      authStorage.isSessionExpired,
    ).mockReturnValue(true);

    appStore.setSession({
      access_token: "token-expirado",
      token_type: "bearer",
    });

    expect(
      appStore.isAuthenticated.value,
    ).toBe(false);

    expect(
      appStore.accessToken,
    ).toBeNull();

    expect(
      authStorage.saveStoredSession,
    ).not.toHaveBeenCalled();

    expect(
      authStorage.clearStoredSession,
    ).toHaveBeenCalled();
  });

  it("elimina la sesión correctamente", () => {
    vi.mocked(
      authStorage.createSession,
    ).mockReturnValue({
      accessToken: "token123",
      tokenType: "bearer",
      claims: {
        sub: "usuario-prueba",
      },
    });

    vi.mocked(
      authStorage.isSessionExpired,
    ).mockReturnValue(false);

    appStore.setSession({
      access_token: "token123",
      token_type: "bearer",
    });

    appStore.clearSession();

    expect(
      appStore.isAuthenticated.value,
    ).toBe(false);

    expect(
      appStore.accessToken,
    ).toBeNull();

    expect(
      authStorage.clearStoredSession,
    ).toHaveBeenCalled();
  });

  it("obtiene correctamente el rol", () => {
    vi.mocked(
      authStorage.createSession,
    ).mockReturnValue({
      accessToken: "token123",
      tokenType: "bearer",
      claims: {
        sub: "usuario-prueba",
        role: "manager",
      },
    });

    appStore.setSession({
      access_token: "token123",
      token_type: "bearer",
    });

    expect(
      appStore.roleName.value,
    ).toBe("manager");
  });

  it("obtiene correctamente el schema", () => {
    vi.mocked(
      authStorage.createSession,
    ).mockReturnValue({
      accessToken: "token123",
      tokenType: "bearer",
      claims: {
        sub: "usuario-prueba",
        schema_name: "empresa_demo",
      },
    });

    appStore.setSession({
      access_token: "token123",
      token_type: "bearer",
    });

    expect(
      appStore.schemaName.value,
    ).toBe("empresa_demo");
  });

  it("obtiene correctamente el companyId", () => {
    vi.mocked(
      authStorage.createSession,
    ).mockReturnValue({
      accessToken: "token123",
      tokenType: "bearer",
      claims: {
        sub: "usuario-prueba",
        company_id: "25",
      },
    });

    appStore.setSession({
      access_token: "token123",
      token_type: "bearer",
    });

    expect(
      appStore.companyId.value,
    ).toBe("25");
  });
});