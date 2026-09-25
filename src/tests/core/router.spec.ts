import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type { Router } from "vue-router";

const mocks = vi.hoisted(() => ({
  isAuthenticated: { value: false },
  roleName: { value: "admin" as string | null },
  resolveHomeByRole: vi.fn(() => "/inventory"),
}));

vi.mock("@/stores/app.store", () => ({
  appStore: {
    isAuthenticated: mocks.isAuthenticated,
    roleName: mocks.roleName,
  },
}));

vi.mock("@/utils/roles", () => ({
  resolveHomeByRole: mocks.resolveHomeByRole,
}));

let router: Router;

beforeAll(async () => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  const routerModule = await import("@/app/router");
  router = routerModule.default;
});

describe("protección de rutas", () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    mocks.isAuthenticated.value = false;
    mocks.roleName.value = "admin";
    mocks.resolveHomeByRole.mockReturnValue("/inventory");

    await router.push("/");
    await router.isReady();
  });

  it("redirige al login cuando un usuario sin sesión intenta acceder a inventario", async () => {
    await router.push("/inventory");

    expect(router.currentRoute.value.name).toBe("login");
  });

  it("conserva la ruta solicitada al redirigir al login", async () => {
    await router.push("/inventory");

    expect(router.currentRoute.value.name).toBe("login");

    expect(
      router.currentRoute.value.query.redirect,
    ).toBe("/inventory");
  });

  it("redirige al login al intentar acceder a otra ruta protegida sin sesión", async () => {
    await router.push("/profile");

    expect(router.currentRoute.value.name).toBe("login");

    expect(
      router.currentRoute.value.query.redirect,
    ).toBe("/profile");
  });

  it("permite acceder al login cuando no existe una sesión", async () => {
    await router.push("/login");

    expect(router.currentRoute.value.name).toBe("login");
  });

  it("permite acceder a una ruta protegida cuando existe una sesión válida", async () => {
    mocks.isAuthenticated.value = true;
    mocks.roleName.value = "admin";

    await router.push("/inventory");

    expect(router.currentRoute.value.name).toBe("inventory");
  });
});