
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';

import TaxDashboardView from '@/features/taxation/views/TaxDashboardView.vue';
import { fetchTaxPeriodMetrics } from '@/features/taxation/api';

vi.mock('@/features/taxation/api', () => ({
  fetchTaxPeriodMetrics: vi.fn(),
}));

describe('SCRUM-667: pruebas del Dashboard Tributario', () => {
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
  });

  it('consulta automáticamente las métricas al abrir el dashboard', async () => {
    vi.mocked(fetchTaxPeriodMetrics).mockResolvedValue(mockMetrics);

    const wrapper = mount(TaxDashboardView);
    await flushPromises();

    expect(fetchTaxPeriodMetrics).toHaveBeenCalledOnce();

    const payload = vi.mocked(fetchTaxPeriodMetrics).mock.calls[0][0];

    expect(payload.start_date).toMatch(/^\d{4}-\d{2}-01$/);
    expect(payload.end_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(wrapper.text()).toContain('Dashboard Tributario');
  });

  it('permite actualizar manualmente las métricas', async () => {
    vi.mocked(fetchTaxPeriodMetrics).mockResolvedValue(mockMetrics);

    const wrapper = mount(TaxDashboardView);
    await flushPromises();

    const updateButton = wrapper.findAll('button').find(
      (button) => button.text().includes('Actualizar'),
    );

    expect(updateButton).toBeDefined();

    await updateButton!.trigger('click');
    await flushPromises();

    expect(fetchTaxPeriodMetrics).toHaveBeenCalledTimes(2);
  });

  it('muestra el estado de período fiscal equilibrado', async () => {
    vi.mocked(fetchTaxPeriodMetrics).mockResolvedValue({
      ...mockMetrics,
      tax_debit: 500,
      tax_credit: 500,
      net_tax: 0,
      tax_payable: 0,
      carry_forward: 0,
    });

    const wrapper = mount(TaxDashboardView);
    await flushPromises();

    expect(wrapper.text()).toContain('Período fiscal equilibrado');
    expect(
      wrapper.find('.tax-summary-callout--neutral').exists(),
    ).toBe(true);
  });

  it('deshabilita el botón Actualizar mientras carga métricas', () => {
    vi.mocked(fetchTaxPeriodMetrics).mockReturnValue(
      new Promise(() => {}),
    );

    const wrapper = mount(TaxDashboardView);

    const updateButton = wrapper.findAll('button').find(
      (button) => button.text().includes('Actualizar'),
    );

    expect(updateButton).toBeDefined();
    expect(updateButton!.attributes('disabled')).toBeDefined();
  });
});
