import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';

import SaleModal from '@/features/inventorymovement/components/SaleModal.vue';
import { fetchTaxConfiguration, createSale } from '@/features/sales/api';
import type { InventoryProduct } from '@/features/inventory/types';

// Historia: desglose de impuestos de una venta. Cubre "Integrar Backend"
// (usa /commercial/tax-configuration y /commercial/sales reales, no
// /inventory/movements), "Actualizar valores dinámicamente" y "Mostrar
// operaciones exentas".

vi.mock('@/features/sales/api', () => ({
  fetchTaxConfiguration: vi.fn(),
  createSale: vi.fn(),
}));

vi.mock('@/services/apiClient', () => ({
  getApiErrorMessage: vi.fn((err: unknown) => (err instanceof Error ? err.message : 'Error')),
}));

const products: InventoryProduct[] = [
  {
    id: 'p1',
    nombre: 'Producto A',
    cantidad: 10,
    descripcion: '',
    precio: 100,
    stockMinimo: 1,
    is_active: true,
  },
  {
    id: 'p2',
    nombre: 'Producto B',
    cantidad: 5,
    descripcion: '',
    precio: 50,
    stockMinimo: 1,
    is_active: true,
  },
];

function createWrapper() {
  return mount(SaleModal, { props: { products } });
}

describe('SaleModal — desglose de impuestos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchTaxConfiguration).mockResolvedValue({ tasa_impuesto: 12 });
  });

  it('trae la tasa de IVA de la empresa al abrir el modal', async () => {
    createWrapper();
    await flushPromises();

    expect(fetchTaxConfiguration).toHaveBeenCalledTimes(1);
  });

  it('no muestra el desglose hasta elegir un producto', async () => {
    const wrapper = createWrapper();
    await flushPromises();

    expect(wrapper.text()).not.toContain('Resumen de la venta');
  });

  it('recalcula subtotal/impuesto/total en vivo al cambiar producto o cantidad', async () => {
    const wrapper = createWrapper();
    await flushPromises();

    await wrapper.find('select').setValue('p1');
    await wrapper.find('input[type="number"]').setValue(2);
    await flushPromises();

    // Producto A: precio 100 x 2 = subtotal 200, IVA 12% = 24, total 224
    expect(wrapper.text()).toContain('Q 200.00');
    expect(wrapper.text()).toContain('IVA (12%)');
    expect(wrapper.text()).toContain('Q 24.00');
    expect(wrapper.text()).toContain('Q 224.00');

    // Cambiar de producto recalcula (Producto B: precio 50 x 2 = 100)
    await wrapper.find('select').setValue('p2');
    await flushPromises();
    expect(wrapper.text()).toContain('Q 100.00');

    // Cambiar la cantidad recalcula (50 x 3 = 150)
    await wrapper.find('input[type="number"]').setValue(3);
    await flushPromises();
    expect(wrapper.text()).toContain('Q 150.00');
  });

  it('usa temporalmente IVA del 12% en la vista previa cuando la configuración devuelve 0', async () => {
    vi.mocked(fetchTaxConfiguration).mockResolvedValue({ tasa_impuesto: '0' });

    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.find('select').setValue('p1');
    await wrapper.find('input[type="number"]').setValue(1);
    await flushPromises();

    expect(wrapper.text()).toContain('IVA (12%)');
    expect(wrapper.text()).toContain('Q 12.00');
    expect(wrapper.text()).toContain('Vista previa temporal al 12%');
    expect(wrapper.text()).toContain('registrar la venta con IVA 0%');
  });

  it('venta exenta: el desglose muestra impuesto en 0 sin pedirlo al backend', async () => {
    const wrapper = createWrapper();
    await flushPromises();

    await wrapper.find('select').setValue('p1');
    await wrapper.find('input[type="number"]').setValue(1);
    await wrapper.find('.checkbox-input').setValue(true);
    await flushPromises();

    expect(wrapper.text()).toContain('Exenta de IVA');
    expect(wrapper.text()).toContain('Q 0.00');
    expect(wrapper.text()).toContain('Q 100.00'); // total == subtotal
  });

  it('registra la venta contra el API real (POST /commercial/sales), no contra movimientos', async () => {
    vi.mocked(createSale).mockResolvedValue({
      id: 'v1',
      usuario_id: 'u1',
      cliente_id: null,
      consumidor_final: true,
      cliente_nombre: null,
      fecha: '2026-01-01',
      subtotal: 200,
      descuento: 0,
      impuesto: 24,
      tasa_impuesto: 12,
      es_exenta: false,
      total: 224,
      estado: 'completada',
      items: [],
    });

    const wrapper = createWrapper();
    await flushPromises();

    await wrapper.find('select').setValue('p1');
    await wrapper.find('input[type="number"]').setValue(2);
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(createSale).toHaveBeenCalledWith({
      items: [{ producto_id: 'p1', cantidad: 2 }],
      es_exenta: false,
    });
    expect(wrapper.emitted('created')).toBeTruthy();
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('si falla la consulta de la tasa de IVA, la venta se puede registrar igual', async () => {
    vi.mocked(fetchTaxConfiguration).mockRejectedValue(new Error('offline'));
    vi.mocked(createSale).mockResolvedValue({
      id: 'v1',
      usuario_id: 'u1',
      cliente_id: null,
      consumidor_final: true,
      cliente_nombre: null,
      fecha: '2026-01-01',
      subtotal: 100,
      descuento: 0,
      impuesto: 12,
      tasa_impuesto: 12,
      es_exenta: false,
      total: 112,
      estado: 'completada',
      items: [],
    });

    const wrapper = createWrapper();
    await flushPromises();

    expect(wrapper.text()).toContain('No se pudo cargar la tasa de IVA');
    expect(wrapper.text()).not.toContain('Resumen de la venta');

    await wrapper.find('select').setValue('p1');
    await wrapper.find('input[type="number"]').setValue(1);
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(createSale).toHaveBeenCalledWith({
      items: [{ producto_id: 'p1', cantidad: 1 }],
      es_exenta: false,
    });
  });
});
