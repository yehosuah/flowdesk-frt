
import {
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import type { Router } from 'vue-router';

const CATCH_ALL_PATH = '/:pathMatch(.*)*';

let router: Router;

describe('SCRUM-767: Rutas catch-all', () => {
  beforeAll(async () => {
    // Simular matchMedia para los componentes que
    // dependen de la configuración visual del navegador.
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );

    // Importar el router después de preparar jsdom.
    const routerModule = await import('@/app/router');
    router = routerModule.default;
  });

  it('mantiene una sola ruta catch-all', () => {
    const catchAllRoutes = router
      .getRoutes()
      .filter((route) => route.path === CATCH_ALL_PATH);

    expect(catchAllRoutes).toHaveLength(1);
  });

  it('conserva las rutas principales', () => {
    const routeNames = router
      .getRoutes()
      .map((route) => route.name);

    expect(routeNames).toContain('login');
    expect(routeNames).toContain('inventory');
    expect(routeNames).toContain('sales');
    expect(routeNames).toContain('inventorymovement');
    expect(routeNames).toContain('tasks');
    expect(routeNames).toContain('profile');
  });

  it('redirige las rutas desconocidas al login', () => {
    const result = router.resolve(
      '/ruta-que-no-existe-scrum767',
    );

    expect(result.matched).toHaveLength(1);
    expect(result.matched[0]?.redirect).toEqual({
      name: 'login',
    });
  });
});
