import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, type Ref } from 'vue';

import { fetchAlerts } from '@/features/analytics/api';
import { appStore } from '@/stores/app.store';
import { useInventoryAlerts } from '@/features/notifications/useInventoryAlerts';

vi.mock('@/features/analytics/api', () => ({
  fetchAlerts: vi.fn(),
}));

// ref() se crea acá adentro (no en vi.hoisted) porque el factory de
// vi.mock se ejecuta de forma perezosa, después de que los imports reales
// ya están resueltos; vi.hoisted en cambio corre demasiado pronto y
// "ref" todavía no existe en ese punto.
vi.mock('@/stores/app.store', () => ({
  appStore: { companyId: ref<string | null>('company-a') },
}));

// El mock expone companyId como un ref real y escribible, pero el tipo
// público de appStore.companyId es ComputedRef<T> (de solo lectura) — este
// cast es solo para poder mutarlo desde la prueba.
const mockedCompanyId = appStore.companyId as unknown as Ref<string | null>;

// Bug real encontrado al validar: useInventoryAlerts es un singleton de
// módulo. Sin el watcher que reacciona a companyId, cerrar sesión e iniciar
// sesión con otra empresa (sin recargar la página) seguiría mostrando las
// alertas de la empresa anterior, porque "loaded" ya estaría en true.
describe('useInventoryAlerts — reseteo al cambiar de empresa/sesión', () => {
  beforeEach(() => {
    vi.mocked(fetchAlerts).mockClear();
    mockedCompanyId.value = 'company-a';
  });

  it('descarta las alertas de la empresa anterior cuando cambia companyId', async () => {
    vi.mocked(fetchAlerts).mockResolvedValueOnce([
      {
        id: '1',
        producto_id: 'p1',
        tipo: 'stock_bajo',
        mensaje: 'Alerta de la empresa A',
        fecha: '2026-01-01',
        estado: 'abierta',
        resuelta_en: null,
      },
    ]);

    const { alerts, refresh } = useInventoryAlerts();
    await refresh();

    expect(alerts.value).toHaveLength(1);
    expect(alerts.value[0].mensaje).toBe('Alerta de la empresa A');

    // Simula logout + login con otra empresa, sin recargar la página.
    mockedCompanyId.value = null;
    await Promise.resolve();
    mockedCompanyId.value = 'company-b';
    await Promise.resolve();

    expect(alerts.value).toHaveLength(0);

    // La próxima vez que algo llame a useInventoryAlerts(), vuelve a pedir
    // el endpoint (ya con el token/empresa nuevos) en vez de quedarse con
    // los datos viejos.
    vi.mocked(fetchAlerts).mockResolvedValueOnce([
      {
        id: '2',
        producto_id: 'p2',
        tipo: 'sin_stock',
        mensaje: 'Alerta de la empresa B',
        fecha: '2026-02-01',
        estado: 'abierta',
        resuelta_en: null,
      },
    ]);

    useInventoryAlerts();
    await Promise.resolve();
    await Promise.resolve();

    expect(alerts.value).toHaveLength(1);
    expect(alerts.value[0].mensaje).toBe('Alerta de la empresa B');
  });
});
