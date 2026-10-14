import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import TaxDashboardView from '@/features/taxation/views/TaxDashboardView.vue';
import TaxFiltersBar from '@/features/taxation/components/TaxFiltersBar.vue';
import TaxMetricCards from '@/features/taxation/components/TaxMetricCards.vue';
import { fetchTaxPeriodMetrics } from '@/features/taxation/api';

vi.mock('@/features/taxation/api', () => ({
  fetchTaxPeriodMetrics: vi.fn(),
}));

describe('TaxDashboardView', () => {
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

  it('muestra skeletons de carga al iniciar', () => {
    vi.mocked(fetchTaxPeriodMetrics).mockReturnValue(new Promise(() => {})); // Never resolves
    const wrapper = mount(TaxDashboardView);

    expect(wrapper.find('.tax-metrics-skeleton-grid').exists()).toBe(true);
    expect(wrapper.findAll('.metric-card-skeleton').length).toBe(7);
  });

  it('renderiza título, selector de filtros y tarjetas de métricas tras cargar', async () => {
    vi.mocked(fetchTaxPeriodMetrics).mockResolvedValue(mockMetrics);
    const wrapper = mount(TaxDashboardView);

    await flushPromises();

    expect(wrapper.text()).toContain('Dashboard Tributario');
    expect(wrapper.text()).toContain('Régimen General IVA (12%)');
    expect(wrapper.findComponent(TaxFiltersBar).exists()).toBe(true);
    expect(wrapper.findComponent(TaxMetricCards).exists()).toBe(true);
    expect(wrapper.text()).toContain('Obligación tributaria líquida por pagar');
  });

  it('muestra mensaje y estado vacío cuando no existen movimientos en el período', async () => {
    vi.mocked(fetchTaxPeriodMetrics).mockResolvedValue({
      tax_debit: 0,
      tax_credit: 0,
      net_tax: 0,
      tax_payable: 0,
      carry_forward: 0,
      withholding_tax: 0,
      input_documents_count: 0,
    });

    const wrapper = mount(TaxDashboardView);
    await flushPromises();

    expect(wrapper.find('.empty-state-wrapper').exists()).toBe(true);
    expect(wrapper.text()).toContain('Sin movimientos fiscales registrados');
  });

  it('muestra alerta de error y permite reintentar cuando falla la llamada a la API', async () => {
    vi.mocked(fetchTaxPeriodMetrics).mockRejectedValueOnce(new Error('Fallo de conexión tributaria'));

    const wrapper = mount(TaxDashboardView);
    await flushPromises();

    expect(wrapper.text()).toContain('Fallo de conexión tributaria');
    expect(wrapper.text()).toContain('Reintentar');

    vi.mocked(fetchTaxPeriodMetrics).mockResolvedValueOnce(mockMetrics);
    const retryBtn = wrapper.find('.error-action button');
    expect(retryBtn.exists()).toBe(true);
    await retryBtn.trigger('click');
    await flushPromises();

    expect(wrapper.findComponent(TaxMetricCards).exists()).toBe(true);
  });

  it('muestra callout de crédito acumulado cuando el remanente a favor es mayor a 0', async () => {
    vi.mocked(fetchTaxPeriodMetrics).mockResolvedValue({
      tax_debit: 300,
      tax_credit: 900,
      net_tax: -600,
      tax_payable: 0,
      carry_forward: 600,
      withholding_tax: 50,
      input_documents_count: 5,
    });

    const wrapper = mount(TaxDashboardView);
    await flushPromises();

    expect(wrapper.text()).toContain('Crédito fiscal acumulado a favor del contribuyente');
    expect(wrapper.find('.tax-summary-callout--credit').exists()).toBe(true);
  });

  it('permite abrir el modal de perfil fiscal desde el botón del encabezado', async () => {
    vi.mocked(fetchTaxPeriodMetrics).mockResolvedValue(mockMetrics);
    const wrapper = mount(TaxDashboardView);
    await flushPromises();

    expect(wrapper.find('.profile-modal').exists()).toBe(false);

    const profileBtn = wrapper.findAll('button').find((b) => b.text().includes('Perfil Fiscal'));
    expect(profileBtn).toBeDefined();
    await profileBtn!.trigger('click');
    await flushPromises();

    expect(wrapper.find('.profile-modal').exists()).toBe(true);
    expect(wrapper.text()).toContain('Perfil Tributario de la Empresa');
  });

  it('muestra opción directa para activar perfil tributario cuando la API devuelve error de perfil inexistente', async () => {
    vi.mocked(fetchTaxPeriodMetrics).mockRejectedValueOnce(
      new Error('No tax profile is active for the requested period')
    );

    const wrapper = mount(TaxDashboardView);
    await flushPromises();

    expect(wrapper.find('.no-profile-callout').exists()).toBe(true);
    expect(wrapper.text()).toContain('Activar Perfil Tributario (12%)');
  });
});

describe('TaxFiltersBar', () => {
  it('emite evento update:month al cambiar de mes', async () => {
    const wrapper = mount(TaxFiltersBar, {
      props: {
        month: 5,
        year: 2026,
      },
    });

    const monthSelect = wrapper.find('#month-select');
    await monthSelect.setValue(8);

    expect(wrapper.emitted('update:month')).toBeTruthy();
    expect(wrapper.emitted('update:month')?.[0]).toEqual([8]);
  });

  it('emite evento update:year al cambiar de año', async () => {
    const wrapper = mount(TaxFiltersBar, {
      props: {
        month: 5,
        year: 2026,
      },
    });

    const yearSelect = wrapper.find('#year-select');
    await yearSelect.setValue(2025);

    expect(wrapper.emitted('update:year')).toBeTruthy();
    expect(wrapper.emitted('update:year')?.[0]).toEqual([2025]);
  });
});
