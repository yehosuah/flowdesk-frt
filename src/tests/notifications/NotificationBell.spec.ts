import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';

import NotificationBell from '@/features/notifications/components/NotificationBell.vue';
import { useInventoryAlerts } from '@/features/notifications/useInventoryAlerts';
import { fetchAlerts } from '@/features/analytics/api';

const mocks = vi.hoisted(() => ({ routerPush: vi.fn() }));

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mocks.routerPush }),
}));

vi.mock('@/features/analytics/api', () => ({
  fetchAlerts: vi.fn(),
}));

function makeAlert(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: '1',
    producto_id: 'p1',
    tipo: 'stock_bajo',
    mensaje: 'Lápiz HB está por agotarse',
    fecha: '2026-01-01T00:00:00Z',
    estado: 'abierta',
    resuelta_en: null,
    ...overrides,
  };
}

// useInventoryAlerts es un singleton a nivel de módulo (mismo patrón que
// appStore): hay que refrescarlo explícitamente con el mock de turno antes
// de cada test en vez de confiar en el auto-fetch de la primera llamada,
// porque ese auto-fetch solo ocurre una vez en todo el proceso de pruebas.
async function seedAlerts(alerts: ReturnType<typeof makeAlert>[]) {
  // mockResolvedValue (no "Once"): el panel vuelve a pedir las alertas cada
  // vez que se abre, así que el mock debe seguir respondiendo igual en
  // llamadas posteriores dentro del mismo test.
  vi.mocked(fetchAlerts).mockResolvedValue(alerts);
  await useInventoryAlerts().refresh();
}

// El panel se teletransporta a <body> (ver NotificationBell.vue), así que
// hay que montar con attachTo y consultar el DOM real, no wrapper.find().
function mountBell() {
  return mount(NotificationBell, { attachTo: document.body });
}

describe('NotificationBell', () => {
  beforeEach(() => {
    mocks.routerPush.mockClear();
    vi.mocked(fetchAlerts).mockClear();
  });

  it('muestra el badge con la cantidad de alertas abiertas', async () => {
    await seedAlerts([makeAlert({ id: '1' }), makeAlert({ id: '2' })]);

    const wrapper = mountBell();
    await flushPromises();

    expect(wrapper.find('.notif-bell__badge').text()).toBe('2');
    wrapper.unmount();
  });

  it('no muestra el badge cuando no hay alertas', async () => {
    await seedAlerts([]);

    const wrapper = mountBell();
    await flushPromises();

    expect(wrapper.find('.notif-bell__badge').exists()).toBe(false);
    wrapper.unmount();
  });

  it('muestra el estado vacío dentro del panel cuando no hay alertas', async () => {
    await seedAlerts([]);

    const wrapper = mountBell();
    await wrapper.find('.notif-bell__trigger').trigger('click');
    await flushPromises();

    expect(document.body.textContent).toContain('No tienes alertas pendientes');
    wrapper.unmount();
  });

  it('lista las alertas y navega a Inventario al hacer clic en una', async () => {
    await seedAlerts([makeAlert({ mensaje: 'Harina está por agotarse' })]);

    const wrapper = mountBell();
    await wrapper.find('.notif-bell__trigger').trigger('click');
    await flushPromises();

    expect(document.body.textContent).toContain('Harina está por agotarse');

    document.querySelector<HTMLButtonElement>('.notif-bell__item')?.click();
    await flushPromises();

    expect(mocks.routerPush).toHaveBeenCalledWith({ name: 'inventory' });
    // El panel se cierra y avisa al layout para que también cierre el
    // sidebar en mobile.
    expect(document.querySelector('.notif-bell__panel')).toBeNull();
    expect(wrapper.emitted('navigate')).toBeTruthy();
    wrapper.unmount();
  });

  it('se puede abrir y cerrar el panel con el botón', async () => {
    await seedAlerts([]);

    const wrapper = mountBell();
    expect(document.querySelector('.notif-bell__panel')).toBeNull();

    await wrapper.find('.notif-bell__trigger').trigger('click');
    expect(document.querySelector('.notif-bell__panel')).not.toBeNull();

    await wrapper.find('.notif-bell__trigger').trigger('click');
    expect(document.querySelector('.notif-bell__panel')).toBeNull();
    wrapper.unmount();
  });

  it('muestra un mensaje de error si falla la carga', async () => {
    vi.mocked(fetchAlerts).mockRejectedValue(new Error('offline'));
    await useInventoryAlerts().refresh();

    const wrapper = mountBell();
    await wrapper.find('.notif-bell__trigger').trigger('click');
    await flushPromises();

    expect(document.body.textContent).toContain('No se pudieron cargar las notificaciones.');
    wrapper.unmount();
  });
});
