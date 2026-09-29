import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';

import SuppliersView from '@/features/suppliers/views/SuppliersView.vue';
import {
  fetchSuppliers,
  fetchSupplierProducts,
  createSupplier,
  updateSupplier,
  toggleSupplierStatus,
  type Supplier,
} from '@/features/suppliers/api';

// Flujo comercial completo (SCRUM-391): creación, edición, consulta y
// desactivación de proveedores, montando la vista real junto con el modal
// real (sin stubs). Se mockea useAuth como admin porque el cambio de estado
// de proveedores está restringido a ese rol (ver src/utils/permissions.ts,
// alineado con PATCH /inventory/suppliers/{id}/status del backend).

vi.mock('@/features/suppliers/api', () => ({
  fetchSuppliers: vi.fn(),
  fetchSupplierProducts: vi.fn(),
  createSupplier: vi.fn(),
  updateSupplier: vi.fn(),
  toggleSupplierStatus: vi.fn(),
}));

vi.mock('@/services/apiClient', () => ({
  getApiErrorMessage: vi.fn((err: unknown) => (err instanceof Error ? err.message : 'Error')),
}));

vi.mock('@/composables/useAuth', () => ({
  useAuth: () => ({
    role: { value: 'admin' },
    is: () => true,
    can: () => true,
    canAccessRoute: () => true,
  }),
}));

function makeSupplier(overrides: Partial<Supplier> = {}): Supplier {
  return {
    id: '1',
    nombre: 'Proveedor Base',
    telefono: '55551234',
    correo: 'base@test.com',
    direccion: 'Zona 1',
    is_active: true,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    ...overrides,
  };
}

describe('Flujo comercial completo: Proveedores', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchSupplierProducts).mockResolvedValue([]);
  });

  it('creación: registra un proveedor nuevo y lo deja seleccionado en el detalle', async () => {
    const existing = makeSupplier({ id: '1', nombre: 'Proveedor Existente' });
    const created = makeSupplier({ id: '2', nombre: 'Proveedor Nuevo' });

    vi.mocked(fetchSuppliers)
      .mockResolvedValueOnce([existing])
      .mockResolvedValueOnce([existing, created]);
    vi.mocked(createSupplier).mockResolvedValue(created);

    const wrapper = mount(SuppliersView);
    await flushPromises();

    expect(wrapper.find('.detail-name').text()).toBe('Proveedor Existente');

    await wrapper.find('.btn-add').trigger('click');
    await wrapper.find('input[placeholder="Ej. Distribuidora San Juan (Bebidas)"]').setValue('Proveedor Nuevo');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(createSupplier).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: 'Proveedor Nuevo' }),
    );
    expect(wrapper.find('.modal-overlay').exists()).toBe(false);
    expect(wrapper.find('.detail-name').text()).toBe('Proveedor Nuevo');
  });

  it('edición: actualiza los datos y se reflejan en la lista y el detalle', async () => {
    const original = makeSupplier({ id: '1', nombre: 'Nombre Original', telefono: '11112222' });
    const edited = makeSupplier({ id: '1', nombre: 'Nombre Editado', telefono: '22223333' });

    vi.mocked(fetchSuppliers)
      .mockResolvedValueOnce([original])
      .mockResolvedValueOnce([edited]);
    vi.mocked(updateSupplier).mockResolvedValue(edited);

    const wrapper = mount(SuppliersView);
    await flushPromises();

    await wrapper.find('.btn-icon-action').trigger('click'); // Editar
    await wrapper.find('input[placeholder="Ej. Distribuidora San Juan (Bebidas)"]').setValue('Nombre Editado');
    await wrapper.find('input[type="tel"]').setValue('22223333');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(updateSupplier).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({ nombre: 'Nombre Editado', telefono: '22223333' }),
    );
    expect(wrapper.find('.detail-name').text()).toBe('Nombre Editado');
    expect(wrapper.find('.supplier-name').text()).toContain('Nombre Editado');
    expect(wrapper.text()).toContain('22223333');
  });

  it('consulta: seleccionar un proveedor de la lista muestra sus datos de contacto', async () => {
    const a = makeSupplier({ id: '1', nombre: 'Proveedor A', telefono: '11112222', correo: 'a@test.com' });
    const b = makeSupplier({ id: '2', nombre: 'Proveedor B', telefono: '22223333', correo: 'b@test.com' });
    vi.mocked(fetchSuppliers).mockResolvedValue([a, b]);

    const wrapper = mount(SuppliersView);
    await flushPromises();

    const items = wrapper.findAll('.supplier-item');
    expect(items.length).toBe(2);

    await items[1].trigger('click');
    await flushPromises();

    expect(wrapper.find('.detail-name').text()).toBe('Proveedor B');
    expect(wrapper.text()).toContain('22223333');
    expect(wrapper.text()).toContain('b@test.com');
  });

  it('desactivación: pide confirmación y no salta la selección a otro proveedor mientras el modal sigue abierto', async () => {
    const active = makeSupplier({ id: '1', nombre: 'Proveedor Activo', is_active: true });
    const deactivated = { ...active, is_active: false };

    vi.mocked(fetchSuppliers).mockResolvedValue([active]);
    vi.mocked(toggleSupplierStatus).mockResolvedValue(deactivated);

    const wrapper = mount(SuppliersView);
    await flushPromises();
    expect(fetchSuppliers).toHaveBeenCalledTimes(1);

    await wrapper.find('.btn-icon-action').trigger('click');
    await wrapper.find('.btn-status-toggle').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('Desactivar proveedor');

    await wrapper.find('.confirm-btn--danger').trigger('click');
    await flushPromises();

    expect(toggleSupplierStatus).toHaveBeenCalledWith('1', false);
    expect(fetchSuppliers).toHaveBeenCalledTimes(1);
    expect(wrapper.find('.detail-name').text()).toBe('Proveedor Activo');
    expect(wrapper.find('.detail-title-row .status-dot--inactive').exists()).toBe(true);

    vi.mocked(fetchSuppliers).mockResolvedValueOnce([]);
    await wrapper.find('.btn-close').trigger('click');
    await flushPromises();

    expect(fetchSuppliers).toHaveBeenCalledTimes(2);
    expect(wrapper.text()).toContain('No hay proveedores encontrados.');
  });

  it('reactivación: activar un proveedor inactivo no pide confirmación', async () => {
    const inactive = makeSupplier({ id: '1', nombre: 'Proveedor Inactivo', is_active: false });
    const reactivated = { ...inactive, is_active: true };

    vi.mocked(fetchSuppliers).mockResolvedValue([inactive]);
    vi.mocked(toggleSupplierStatus).mockResolvedValue(reactivated);

    const wrapper = mount(SuppliersView);
    await flushPromises();

    await wrapper.find('.btn-icon-action').trigger('click');
    await wrapper.find('.btn-status-toggle').trigger('click');
    await flushPromises();

    expect(wrapper.find('.confirm-box').exists()).toBe(false);
    expect(toggleSupplierStatus).toHaveBeenCalledWith('1', true);
    expect(wrapper.find('.detail-title-row .status-dot--active').exists()).toBe(true);
  });

  // La restricción de "solo admin cambia el estado de un proveedor" ya se
  // valida a nivel de matriz en src/tests/core/permissions.spec.ts
  // ("solo admin cambia el estado de un proveedor"); acá no se repite con
  // un segundo useAuth mockeado dentro del mismo archivo porque Vitest no
  // permite reconfigurarlo de forma confiable por test dentro de un mismo
  // spec sin resetear todos los demás mocks del archivo.
});
