import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';

import AnalyticsView from '@/features/analytics/views/AnalyticsView.vue';
import {
  fetchAlerts,
  fetchHistory,
  fetchMetrics,
  fetchProductAnalytics,
  fetchTrend,
} from '@/features/analytics/api';

vi.mock('@/features/analytics/api', () => ({
  fetchMetrics: vi.fn(),
  fetchTrend: vi.fn(),
  fetchProductAnalytics: vi.fn(),
  fetchHistory: vi.fn(),
  fetchAlerts: vi.fn(),
  fetchAIInsights: vi.fn(),
}));

vi.mock('@/services/apiClient', () => ({
  getApiErrorMessage: vi.fn(() => 'Error al cargar los datos'),
}));

vi.mock('vue-chartjs', () => ({
  Bar: {
    template: '<div class="bar-chart-stub" />',
  },
  Line: {
    template: '<div class="line-chart-stub" />',
  },
  Doughnut: {
    template: '<div class="doughnut-chart-stub" />',
  },
}));

describe('AnalyticsView - estados vacíos', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(fetchMetrics).mockResolvedValue({
      period: '30d',
      product_id: null,
      start_date: '2026-09-01',
      end_date: '2026-09-30',
      entradas: 0,
      salidas: 0,
      stock_bajo: 0,
      sin_stock: 0,
    });

    vi.mocked(fetchTrend).mockResolvedValue({
      period: '30d',
      window: 'day',
      product_id: null,
      start_date: '2026-09-01',
      end_date: '2026-09-30',
      points: [],
    });

    vi.mocked(fetchProductAnalytics).mockResolvedValue({
      period: '30d',
      sort_by: 'outbound',
      start_date: '2026-09-01',
      end_date: '2026-09-30',
      products: [],
    });

    vi.mocked(fetchHistory).mockResolvedValue([]);
    vi.mocked(fetchAlerts).mockResolvedValue([]);
  });

  async function mountView() {
    const wrapper = mount(AnalyticsView);
    await flushPromises();

    return wrapper;
  }

  it('muestra estado vacío cuando no existen movimientos en el período', async () => {
    const wrapper = await mountView();

    expect(wrapper.text()).toContain(
      'No hay movimientos en este período.',
    );
  });

  it('muestra estado vacío cuando no existen movimientos recientes', async () => {
    const wrapper = await mountView();

    expect(wrapper.text()).toContain(
      'No hay movimientos recientes.',
    );
  });

  it('muestra estado vacío cuando no existen productos para analizar', async () => {
    const wrapper = await mountView();

    expect(wrapper.text()).toContain('Sin datos.');
  });

  it('muestra estado vacío cuando no existen alertas de reabastecimiento', async () => {
    const wrapper = await mountView();

    expect(wrapper.text()).toContain('No hay alertas.');
  });

  it('muestra estado vacío cuando no existe stock muerto', async () => {
    const wrapper = await mountView();

    const tabs = wrapper.findAll('.tab-btn');
    const productsTab = tabs.find(
      (tab) => tab.text() === 'Productos',
    );

    expect(productsTab).toBeDefined();

    await productsTab!.trigger('click');

    expect(wrapper.text()).toContain(
      'No hay stock muerto detectado.',
    );
  });
});
