import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';

import ClientView from '@/features/clients/views/ClientView.vue';
import {
  fetchClients,
  createClient,
  updateClient,
  toggleClientStatus,
  type Client,
} from '@/features/clients/api';

// Flujo comercial completo (SCRUM-391): creación, edición, consulta y
// desactivación de clientes, montando la vista real junto con el modal real
// (sin stubs) para validar que el estado se propaga correctamente entre
// ambos, incluyendo el bug de sincronización corregido en ClientView.

vi.mock('@/features/clients/api', () => ({
  fetchClients: vi.fn(),
  createClient: vi.fn(),
  updateClient: vi.fn(),
  toggleClientStatus: vi.fn(),
}));

vi.mock('@/services/apiClient', () => ({
  getApiErrorMessage: vi.fn((err: unknown) => (err instanceof Error ? err.message : 'Error')),
}));

function makeClient(overrides: Partial<Client> = {}): Client {
  return {
    id: '1',
    nombre: 'Cliente Base',
    telefono: '55551234',
    correo: 'base@test.com',
    direccion: 'Zona 1',
    is_active: true,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    ...overrides,
  };
}

describe('Flujo comercial completo: Clientes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creación: registra un cliente nuevo y lo deja seleccionado en el detalle', async () => {
    const existing = makeClient({ id: '1', nombre: 'Cliente Existente' });
    const created = makeClient({ id: '2', nombre: 'Cliente Nuevo' });

    vi.mocked(fetchClients)
      .mockResolvedValueOnce([existing])
      .mockResolvedValueOnce([existing, created]);
    vi.mocked(createClient).mockResolvedValue(created);

    const wrapper = mount(ClientView);
    await flushPromises();

    expect(wrapper.find('.detail-name').text()).toBe('Cliente Existente');

    await wrapper.find('.btn-add').trigger('click');
    await wrapper.find('input[placeholder="Ej. Juan Pérez"]').setValue('Cliente Nuevo');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(createClient).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: 'Cliente Nuevo' }),
    );
    expect(wrapper.find('.modal-overlay').exists()).toBe(false);
    expect(wrapper.find('.detail-name').text()).toBe('Cliente Nuevo');
  });

  it('edición: actualiza los datos y se reflejan en la lista y el detalle', async () => {
    const original = makeClient({ id: '1', nombre: 'Nombre Original', telefono: '11112222' });
    const edited = makeClient({ id: '1', nombre: 'Nombre Editado', telefono: '22223333' });

    vi.mocked(fetchClients)
      .mockResolvedValueOnce([original])
      .mockResolvedValueOnce([edited]);
    vi.mocked(updateClient).mockResolvedValue(edited);

    const wrapper = mount(ClientView);
    await flushPromises();

    await wrapper.find('.btn-icon-action').trigger('click'); // Editar
    await wrapper.find('input[placeholder="Ej. Juan Pérez"]').setValue('Nombre Editado');
    await wrapper.find('input[type="tel"]').setValue('22223333');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(updateClient).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({ nombre: 'Nombre Editado', telefono: '22223333' }),
    );
    expect(wrapper.find('.detail-name').text()).toBe('Nombre Editado');
    expect(wrapper.find('.client-name').text()).toContain('Nombre Editado');
    expect(wrapper.text()).toContain('22223333');
  });

  it('consulta: seleccionar un cliente de la lista muestra sus datos de contacto', async () => {
    const a = makeClient({ id: '1', nombre: 'Cliente A', telefono: '11112222', correo: 'a@test.com' });
    const b = makeClient({ id: '2', nombre: 'Cliente B', telefono: '22223333', correo: 'b@test.com' });
    vi.mocked(fetchClients).mockResolvedValue([a, b]);

    const wrapper = mount(ClientView);
    await flushPromises();

    const items = wrapper.findAll('.client-item');
    expect(items.length).toBe(2);

    await items[1].trigger('click');

    expect(wrapper.find('.detail-name').text()).toBe('Cliente B');
    expect(wrapper.text()).toContain('22223333');
    expect(wrapper.text()).toContain('b@test.com');
  });

  it('desactivación: pide confirmación y no salta la selección a otro cliente mientras el modal sigue abierto', async () => {
    const active = makeClient({ id: '1', nombre: 'Cliente Activo', is_active: true });
    const deactivated = { ...active, is_active: false };

    vi.mocked(fetchClients).mockResolvedValue([active]);
    vi.mocked(toggleClientStatus).mockResolvedValue(deactivated);

    const wrapper = mount(ClientView);
    await flushPromises();
    expect(fetchClients).toHaveBeenCalledTimes(1);

    await wrapper.find('.btn-icon-action').trigger('click');
    await wrapper.find('.btn-status-toggle').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('Desactivar cliente');

    await wrapper.find('.confirm-btn--danger').trigger('click');
    await flushPromises();

    expect(toggleClientStatus).toHaveBeenCalledWith('1', false);
    // No debe haber pedido la lista de nuevo todavía: eso evita que la
    // selección salte a otro cliente mientras el modal sigue abierto.
    expect(fetchClients).toHaveBeenCalledTimes(1);
    expect(wrapper.find('.detail-name').text()).toBe('Cliente Activo');
    expect(wrapper.find('.detail-title-row .status-dot--inactive').exists()).toBe(true);

    // Al cerrar el modal, recién ahí se reconcilia con el filtro (Activos).
    vi.mocked(fetchClients).mockResolvedValueOnce([]);
    await wrapper.find('.btn-close').trigger('click');
    await flushPromises();

    expect(fetchClients).toHaveBeenCalledTimes(2);
    expect(wrapper.text()).toContain('No hay clientes encontrados.');
  });

  it('reactivación: activar un cliente inactivo no pide confirmación', async () => {
    const inactive = makeClient({ id: '1', nombre: 'Cliente Inactivo', is_active: false });
    const reactivated = { ...inactive, is_active: true };

    vi.mocked(fetchClients).mockResolvedValue([inactive]);
    vi.mocked(toggleClientStatus).mockResolvedValue(reactivated);

    const wrapper = mount(ClientView);
    await flushPromises();

    await wrapper.find('.btn-icon-action').trigger('click');
    await wrapper.find('.btn-status-toggle').trigger('click');
    await flushPromises();

    expect(wrapper.find('.confirm-box').exists()).toBe(false);
    expect(toggleClientStatus).toHaveBeenCalledWith('1', true);
    expect(wrapper.find('.detail-title-row .status-dot--active').exists()).toBe(true);
  });

  it('muestra el error del backend dentro del diálogo si la desactivación falla (p. ej. relaciones activas)', async () => {
    const active = makeClient({ id: '1', nombre: 'Cliente Activo', is_active: true });

    vi.mocked(fetchClients).mockResolvedValue([active]);
    vi.mocked(toggleClientStatus).mockRejectedValue(new Error('El cliente tiene ventas asociadas'));

    const wrapper = mount(ClientView);
    await flushPromises();

    await wrapper.find('.btn-icon-action').trigger('click');
    await wrapper.find('.btn-status-toggle').trigger('click');
    await flushPromises();
    await wrapper.find('.confirm-btn--danger').trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('El cliente tiene ventas asociadas');
    // El diálogo de confirmación sigue abierto y el estado no cambió.
    expect(wrapper.find('.confirm-box').exists()).toBe(true);
    expect(wrapper.find('.status-pill--active').exists()).toBe(true);
  });
});
