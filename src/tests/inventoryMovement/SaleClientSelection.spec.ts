import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';

import SaleModal from '@/features/inventorymovement/components/SaleModal.vue';
import { createSale, fetchTaxConfiguration } from '@/features/sales/api';
import { createClient, fetchClients, type Client } from '@/features/clients/api';
import type { InventoryProduct } from '@/features/inventory/types';

// Clientes conectados con las ventas usando los endpoints actuales: la venta
// busca clientes con GET /clients?search=, crea uno nuevo con POST /clients
// (solo admin y manager, como exige el backend) y envía su cliente_id.
// Sin cliente la venta va a Consumidor Final.

vi.mock('@/features/sales/api', () => ({
  fetchTaxConfiguration: vi.fn(),
  createSale: vi.fn(),
}));

vi.mock('@/features/clients/api', () => ({
  fetchClients: vi.fn(),
  createClient: vi.fn(),
}));

vi.mock('@/services/apiClient', () => ({
  getApiErrorMessage: vi.fn((err: unknown) => (err instanceof Error ? err.message : 'Error')),
}));

const auth = vi.hoisted(() => ({ role: 'manager' }));

vi.mock('@/composables/useAuth', async () => {
  const { can } = await import('@/utils/permissions');
  return {
    useAuth: () => ({
      can: (permission: Parameters<typeof can>[1]) => can(auth.role, permission),
    }),
  };
});

const products: InventoryProduct[] = [
  { id: 'p1', nombre: 'Café 1lb', cantidad: 10, descripcion: '', precio: 50, stockMinimo: 1, is_active: true },
];

function makeClient(overrides: Partial<Client> = {}): Client {
  return {
    id: 'c1',
    nombre: 'Ana López',
    telefono: '55551234',
    correo: 'ana@test.com',
    direccion: null,
    is_active: true,
    created_at: '2026-11-01',
    updated_at: '2026-11-01',
    ...overrides,
  };
}

async function mountModal() {
  const wrapper = mount(SaleModal, { props: { products } });
  await flushPromises();
  await wrapper.find('select').setValue('p1');
  await wrapper.find('input[type="number"]').setValue(2);
  return wrapper;
}

type Wrapper = Awaited<ReturnType<typeof mountModal>>;

async function searchClient(wrapper: Wrapper, term: string) {
  await wrapper.find('#sale-client-search').setValue(term);
  await vi.advanceTimersByTimeAsync(300);
  await flushPromises();
}

async function submit(wrapper: Wrapper) {
  await wrapper.find('form').trigger('submit');
  await flushPromises();
}

describe('SaleModal: cliente de la venta', () => {
  beforeEach(() => {
    // Solo se simula el temporizador de la búsqueda; flushPromises usa setImmediate.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    vi.clearAllMocks();
    auth.role = 'manager';
    vi.mocked(fetchTaxConfiguration).mockResolvedValue({ tasa_impuesto: 12 });
    vi.mocked(createSale).mockResolvedValue({} as never);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sin cliente, registra la venta a Consumidor Final (sin cliente_id)', async () => {
    const wrapper = await mountModal();

    expect(wrapper.find('#sale-client-search').attributes('placeholder')).toBe('Consumidor Final');

    await submit(wrapper);

    expect(createSale).toHaveBeenCalledWith({
      items: [{ producto_id: 'p1', cantidad: 2 }],
      es_exenta: false,
    });
    expect(createClient).not.toHaveBeenCalled();
  });

  it('no consulta el backend hasta tener al menos 2 caracteres', async () => {
    const wrapper = await mountModal();

    await searchClient(wrapper, 'a');

    expect(fetchClients).not.toHaveBeenCalled();
  });

  it('busca clientes activos y envía el cliente_id del elegido', async () => {
    const ana = makeClient();
    vi.mocked(fetchClients).mockResolvedValue([ana]);
    const wrapper = await mountModal();

    await searchClient(wrapper, 'ana');

    expect(fetchClients).toHaveBeenCalledWith('ana', true);
    const option = wrapper.find('.client-results__item');
    expect(option.text()).toContain('Ana López');
    expect(option.text()).toContain('ana@test.com');

    await option.trigger('click');
    expect(wrapper.find('[data-testid="sale-client"]').text()).toContain('Ana López');

    await submit(wrapper);

    expect(createSale).toHaveBeenCalledWith({
      items: [{ producto_id: 'p1', cantidad: 2 }],
      es_exenta: false,
      cliente_id: 'c1',
    });
  });

  it('quitar el cliente elegido vuelve a Consumidor Final', async () => {
    vi.mocked(fetchClients).mockResolvedValue([makeClient()]);
    const wrapper = await mountModal();

    await searchClient(wrapper, 'ana');
    await wrapper.find('.client-results__item').trigger('click');
    await wrapper.find('.client-chip__clear').trigger('click');
    await submit(wrapper);

    expect(createSale).toHaveBeenCalledWith(expect.not.objectContaining({ cliente_id: expect.anything() }));
  });

  it('no asume Consumidor Final si hay texto escrito sin elegir un cliente', async () => {
    vi.mocked(fetchClients).mockResolvedValue([makeClient()]);
    const wrapper = await mountModal();

    await searchClient(wrapper, 'ana');
    await submit(wrapper);

    expect(createSale).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('Elige un cliente de la lista o borra el texto');
  });

  describe('cliente nuevo', () => {
    it('admin o manager lo registra al confirmar la venta, no antes', async () => {
      vi.mocked(fetchClients).mockResolvedValue([]);
      vi.mocked(createClient).mockResolvedValue(makeClient({ id: 'nuevo', nombre: 'Luis Gómez' }));
      const wrapper = await mountModal();

      await searchClient(wrapper, 'Luis Gómez');
      const registerOption = wrapper.find('.client-results__item--new');
      expect(registerOption.text()).toContain('Registrar «Luis Gómez» como cliente nuevo');

      await registerOption.trigger('click');
      expect(wrapper.find('.client-chip__tag').text()).toBe('Nuevo');
      expect(createClient).not.toHaveBeenCalled();

      await submit(wrapper);

      expect(createClient).toHaveBeenCalledWith({ nombre: 'Luis Gómez' });
      expect(createSale).toHaveBeenCalledWith(expect.objectContaining({ cliente_id: 'nuevo' }));
      expect(vi.mocked(createClient).mock.invocationCallOrder[0])
        .toBeLessThan(vi.mocked(createSale).mock.invocationCallOrder[0]);
    });

    it('no ofrece registrar un nombre que ya existe en los resultados', async () => {
      vi.mocked(fetchClients).mockResolvedValue([makeClient()]);
      const wrapper = await mountModal();

      await searchClient(wrapper, 'ana lópez');

      expect(wrapper.find('.client-results__item--new').exists()).toBe(false);
    });

    it('el cajero (employee) solo puede elegir clientes existentes', async () => {
      auth.role = 'employee';
      vi.mocked(fetchClients).mockResolvedValue([]);
      const wrapper = await mountModal();

      await searchClient(wrapper, 'Luis');

      expect(wrapper.find('.client-results__item--new').exists()).toBe(false);
      expect(wrapper.text()).toContain('No se encontró ningún cliente con ese dato.');
    });

    it('si el backend rechaza el cliente, no registra la venta y explica el motivo en español', async () => {
      vi.mocked(fetchClients).mockResolvedValue([]);
      vi.mocked(createClient).mockRejectedValue(new Error('Client name already exists'));
      const wrapper = await mountModal();

      await searchClient(wrapper, 'Luis');
      await wrapper.find('.client-results__item--new').trigger('click');
      await submit(wrapper);

      expect(createSale).not.toHaveBeenCalled();
      expect(wrapper.find('.error-alert').text()).toBe(
        'No se pudo registrar el cliente. Ya existe un cliente activo con ese nombre. Búscalo y elígelo de la lista.',
      );
    });

    it('no ofrece registrar un nombre existente aunque quede fuera de los resultados visibles', async () => {
      const many = Array.from({ length: 7 }, (_, i) => makeClient({ id: `c${i}`, nombre: `Luis ${i}` }));
      many[6] = makeClient({ id: 'exacto', nombre: 'Luis' });
      vi.mocked(fetchClients).mockResolvedValue(many);
      const wrapper = await mountModal();

      await searchClient(wrapper, 'Luis');

      expect(wrapper.findAll('.client-results__item:not(.client-results__item--new)')).toHaveLength(6);
      expect(wrapper.find('.client-results__item--new').exists()).toBe(false);
    });

    it('si falla la venta, al reintentar no vuelve a crear el cliente', async () => {
      vi.mocked(fetchClients).mockResolvedValue([]);
      vi.mocked(createClient).mockResolvedValue(makeClient({ id: 'nuevo', nombre: 'Luis' }));
      vi.mocked(createSale)
        .mockRejectedValueOnce(new Error('Stock insuficiente'))
        .mockResolvedValueOnce({} as never);
      const wrapper = await mountModal();

      await searchClient(wrapper, 'Luis');
      await wrapper.find('.client-results__item--new').trigger('click');
      await submit(wrapper);

      expect(wrapper.find('.error-alert').text()).toBe('Stock insuficiente');

      await submit(wrapper);

      expect(createClient).toHaveBeenCalledTimes(1);
      expect(createSale).toHaveBeenCalledTimes(2);
      expect(createSale).toHaveBeenLastCalledWith(expect.objectContaining({ cliente_id: 'nuevo' }));
      expect(wrapper.emitted('created')).toHaveLength(1);
    });
  });

  it('si el cliente se desactivó mientras tanto, explica qué hacer y no cierra el modal', async () => {
    vi.mocked(fetchClients).mockResolvedValue([makeClient()]);
    vi.mocked(createSale).mockRejectedValue(new Error('Client is inactive'));
    const wrapper = await mountModal();

    await searchClient(wrapper, 'ana');
    await wrapper.find('.client-results__item').trigger('click');
    await submit(wrapper);

    expect(wrapper.find('.error-alert').text()).toBe(
      'El cliente fue desactivado. Elige otro o vende a Consumidor Final.',
    );
    expect(wrapper.emitted('close')).toBeUndefined();
  });

  it('los errores de la venta que no son de clientes se muestran igual que antes', async () => {
    vi.mocked(createSale).mockRejectedValue(new Error('Stock insuficiente para Café 1lb'));
    const wrapper = await mountModal();

    await submit(wrapper);

    expect(wrapper.find('.error-alert').text()).toBe('Stock insuficiente para Café 1lb');
  });

  it('muestra el error si la búsqueda de clientes falla', async () => {
    vi.mocked(fetchClients).mockRejectedValue(new Error('No se pudo conectar con el servidor'));
    const wrapper = await mountModal();

    await searchClient(wrapper, 'ana');

    expect(wrapper.find('.client-results').exists()).toBe(false);
    expect(wrapper.text()).toContain('No se pudo conectar con el servidor');
  });
});
