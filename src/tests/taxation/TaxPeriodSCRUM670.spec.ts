
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';

import TaxFiltersBar from '@/features/taxation/components/TaxFiltersBar.vue';
import TaxDashboardView from '@/features/taxation/views/TaxDashboardView.vue';
import { fetchTaxPeriodMetrics } from '@/features/taxation/api';

vi.mock('@/features/taxation/api', () => ({
  fetchTaxPeriodMetrics: vi.fn(),
}));

describe('SCRUM-670: filtros por período tributario', () => {
  const mockMetrics = {
    tax_debit: 1200,
    tax_credit: 450,
    net_tax: 750,
    tax_payable: 750,
    carry_forward: 0,
    withholding_tax: 150,
    input_documents_count: 18,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchTaxPeriodMetrics).mockResolvedValue(mockMetrics);
  });

  it('muestra los 12 meses disponibles', () => {
    const wrapper = mount(TaxFiltersBar, {
      props: { month: 1, year: 2026 },
    });

    const options = wrapper.findAll('#month-select option');

    expect(options).toHaveLength(13);
    expect(options[0].text()).toContain('Todos los meses');
    expect(options[1].text()).toBe('Enero');
    expect(options[12].text()).toBe('Diciembre');
  });

  it('permite seleccionar un año', async () => {
    const wrapper = mount(TaxFiltersBar, {
      props: { month: 5, year: 2026 },
    });

    await wrapper.get('#year-select').setValue('2025');

    expect(wrapper.emitted('update:year')?.[0]).toEqual([2025]);
  });

  it('permite seleccionar el año completo', async () => {
    const wrapper = mount(TaxFiltersBar, {
      props: { month: 5, year: 2026 },
    });

    await wrapper.get('#month-select').setValue('0');

    expect(wrapper.emitted('update:month')?.[0]).toEqual([0]);
  });

  it('consulta el backend con el mes y año seleccionados', async () => {
    const wrapper = mount(TaxDashboardView);
    await flushPromises();

    await wrapper.get('#year-select').setValue('2025');
    await wrapper.get('#month-select').setValue('8');
    await flushPromises();

    expect(fetchTaxPeriodMetrics).toHaveBeenLastCalledWith({
      start_date: '2025-08-01',
      end_date: '2025-08-31',
    });
  });

  it('calcula correctamente febrero de un año bisiesto', async () => {
    const wrapper = mount(TaxDashboardView);
    await flushPromises();

    // El selector ofrece el año actual y los tres anteriores.
    // En octubre de 2026, 2024 está disponible.
    await wrapper.get('#year-select').setValue('2024');
    await wrapper.get('#month-select').setValue('2');
    await flushPromises();

    expect(fetchTaxPeriodMetrics).toHaveBeenLastCalledWith({
      start_date: '2024-02-01',
      end_date: '2024-02-29',
    });
  });

  it('actualiza las métricas cuando cambia el período', async () => {
    const wrapper = mount(TaxDashboardView);
    await flushPromises();

    expect(fetchTaxPeriodMetrics).toHaveBeenCalledOnce();

    await wrapper.get('#month-select').setValue('7');
    await flushPromises();

    expect(fetchTaxPeriodMetrics).toHaveBeenCalledTimes(2);
  });
});
