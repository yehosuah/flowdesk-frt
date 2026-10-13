
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, nextTick, type Ref } from 'vue';

import { fetchAlerts } from '@/features/analytics/api';
import { appStore } from '@/stores/app.store';
import { useInventoryAlerts } from '@/features/notifications/useInventoryAlerts';

vi.mock('@/features/analytics/api', () => ({
  fetchAlerts: vi.fn(),
}));

// Mock del identificador de empresa para simular cambios de sesión.
vi.mock('@/stores/app.store', () => ({
  appStore: { companyId: ref<string | null>('company-a') },
}));

const mockedCompanyId = appStore.companyId as unknown as Ref<string | null>;

// Genera alertas de prueba con la estructura esperada por la API.
function makeAlert(
  id: string,
  tipo: string = 'stock_bajo',
  mensaje: string = 'Producto con pocas existencias',
) {
  return {
    id,
    producto_id: `p${id}`,
    tipo,
    mensaje,
    fecha: '2026-01-01',
    estado: 'abierta',
    resuelta_en: null,
  };
}

describe('SCRUM-675: pruebas de alertas de bajo stock', () => {
  beforeEach(async () => {
    vi.mocked(fetchAlerts).mockReset();

    // Restablecer la empresa y el estado compartido.
    mockedCompanyId.value = null;
    await nextTick();

    mockedCompanyId.value = 'company-a';
    await nextTick();

    vi.mocked(fetchAlerts).mockResolvedValue([]);
    await useInventoryAlerts().refresh();
  });

  // PRUEBA ORIGINAL DE SOFI
  it('descarta las alertas de la empresa anterior cuando cambia companyId', async () => {
    vi.mocked(fetchAlerts).mockResolvedValue([
      makeAlert('1', 'stock_bajo', 'Alerta de la empresa A'),
    ]);

    const { alerts, refresh } = useInventoryAlerts();
    await refresh();

    expect(alerts.value).toHaveLength(1);
    expect(alerts.value[0].mensaje).toBe('Alerta de la empresa A');

    // Simula cerrar sesión e iniciar sesión con otra empresa.
    mockedCompanyId.value = null;
    await nextTick();

    mockedCompanyId.value = 'company-b';
    await nextTick();

    expect(alerts.value).toHaveLength(0);

    vi.mocked(fetchAlerts).mockResolvedValue([
      makeAlert('2', 'sin_stock', 'Alerta de la empresa B'),
    ]);

    await refresh();

    expect(alerts.value).toHaveLength(1);
    expect(alerts.value[0].mensaje).toBe('Alerta de la empresa B');
  });

  // PRUEBA 2
  it('filtra únicamente las alertas de bajo stock y sin stock', async () => {
    vi.mocked(fetchAlerts).mockResolvedValue([
      makeAlert('1', 'stock_bajo'),
      makeAlert('2', 'sin_stock', 'Producto agotado'),
      makeAlert('3', 'otro', 'Notificación no relacionada'),
    ]);

    const { alerts, count, refresh } = useInventoryAlerts();
    await refresh();

    expect(alerts.value).toHaveLength(2);
    expect(alerts.value.map((alert) => alert.tipo)).toEqual([
      'stock_bajo',
      'sin_stock',
    ]);
    expect(count.value).toBe(2);
  });

  // PRUEBA 3
  it('actualiza el conteo cuando cambia la cantidad de alertas', async () => {
    const { count, refresh } = useInventoryAlerts();

    vi.mocked(fetchAlerts).mockResolvedValue([
      makeAlert('1'),
      makeAlert('2'),
    ]);

    await refresh();
    expect(count.value).toBe(2);

    vi.mocked(fetchAlerts).mockResolvedValue([
      makeAlert('3'),
    ]);

    await refresh();
    expect(count.value).toBe(1);

    vi.mocked(fetchAlerts).mockResolvedValue([]);
    await refresh();

    expect(count.value).toBe(0);
  });

  // PRUEBA 4
  it('no muestra alertas cuando la API devuelve una lista vacía', async () => {
    vi.mocked(fetchAlerts).mockResolvedValue([]);

    const { alerts, count, error, refresh } = useInventoryAlerts();
    await refresh();

    expect(alerts.value).toEqual([]);
    expect(count.value).toBe(0);
    expect(error.value).toBe('');
  });

  // PRUEBA 5
  it('muestra un mensaje de error cuando falla la API', async () => {
    vi.mocked(fetchAlerts).mockRejectedValue(
      new Error('Error de conexión'),
    );

    const { error, isLoading, refresh } = useInventoryAlerts();
    await refresh();

    expect(error.value).toBe(
      'No se pudieron cargar las notificaciones.',
    );
    expect(isLoading.value).toBe(false);
  });

  // PRUEBA 6
  it('permite recuperar las alertas después de un error', async () => {
    const { alerts, error, refresh } = useInventoryAlerts();

    vi.mocked(fetchAlerts).mockRejectedValue(
      new Error('Servidor no disponible'),
    );

    await refresh();

    expect(error.value).toBe(
      'No se pudieron cargar las notificaciones.',
    );

    vi.mocked(fetchAlerts).mockResolvedValue([
      makeAlert('1', 'stock_bajo', 'Stock bajo recuperado'),
    ]);

    await refresh();

    expect(error.value).toBe('');
    expect(alerts.value).toHaveLength(1);
    expect(alerts.value[0].mensaje).toBe('Stock bajo recuperado');
  });
});
