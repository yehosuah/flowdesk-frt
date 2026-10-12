
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';

import ReportsView from '@/features/reports/views/ReportsView.vue';
import { fetchPurchaseReport } from '@/features/reports/api';

vi.mock('@/features/reports/api', () => ({
  fetchPurchaseReport: vi.fn(),
}));

vi.mock('@/stores/app.store', () => ({
  appStore: {
    state: {
      session: {
        accessToken: 'token-prueba',
      },
    },
  },
}));

describe('SCRUM-669: selector de régimen tributario', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function mountView() {
    return mount(ReportsView);
  }

  async function selectPurchaseBook(
    wrapper: ReturnType<typeof mountView>,
  ) {
    const commercialButton = wrapper.findAll('button').find(
      (button) => button.text().includes('Comercial / Ventas'),
    );

    expect(commercialButton).toBeDefined();
    await commercialButton!.trigger('click');

    const purchaseOption = wrapper.findAll('button').find(
      (button) => button.text() === 'Libro de Compras',
    );

    expect(purchaseOption).toBeDefined();
    await purchaseOption!.trigger('click');
  }

  it('muestra el selector al elegir Libro de Compras', async () => {
    const wrapper = mountView();

    await selectPurchaseBook(wrapper);

    expect(wrapper.find('#purchase-tax-regime').exists()).toBe(true);
    expect(wrapper.text()).toContain('Régimen Tributario');
  });

  it('muestra los dos regímenes disponibles', async () => {
    const wrapper = mountView();

    await selectPurchaseBook(wrapper);

    const options = wrapper.findAll('#purchase-tax-regime option');

    expect(options).toHaveLength(2);
    expect(options.map((option) => option.text())).toEqual([
      'Pequeño Contribuyente',
      'Régimen General del IVA',
    ]);
  });

  it('selecciona inicialmente el Régimen General del IVA', async () => {
    const wrapper = mountView();

    await selectPurchaseBook(wrapper);

    const select = wrapper.get('#purchase-tax-regime');

    expect((select.element as HTMLSelectElement).value).toBe(
      'GENERAL_VAT',
    );
  });

  it('permite cambiar a Pequeño Contribuyente', async () => {
    const wrapper = mountView();

    await selectPurchaseBook(wrapper);

    const select = wrapper.get('#purchase-tax-regime');

    await select.setValue('SMALL_TAXPAYER');

    expect((select.element as HTMLSelectElement).value).toBe(
      'SMALL_TAXPAYER',
    );
  });

  it('permite regresar al Régimen General del IVA', async () => {
    const wrapper = mountView();

    await selectPurchaseBook(wrapper);

    const select = wrapper.get('#purchase-tax-regime');

    await select.setValue('SMALL_TAXPAYER');
    await select.setValue('GENERAL_VAT');

    expect((select.element as HTMLSelectElement).value).toBe(
      'GENERAL_VAT',
    );
  });

  it('no muestra el selector en el módulo de Inventario', () => {
    const wrapper = mountView();

    expect(wrapper.find('#purchase-tax-regime').exists()).toBe(false);
  });

  it('envía el régimen seleccionado al exportar', async () => {
    const wrapper = mountView();

    await selectPurchaseBook(wrapper);

    await wrapper.get('#purchase-tax-regime').setValue('SMALL_TAXPAYER');

    const calendars = wrapper.findAll('.date-picker');

    const startDay = calendars[0].findAll('button.calendar-day')
      .find((button) => button.text() === '1');

    const endDay = calendars[1].findAll('button.calendar-day')
      .find((button) => button.text() === '10');

    expect(startDay).toBeDefined();
    expect(endDay).toBeDefined();

    await startDay!.trigger('click');
    await endDay!.trigger('click');

    vi.mocked(fetchPurchaseReport).mockResolvedValue(
      new Response(null, { status: 403 }),
    );

    const downloadButton = wrapper.findAll('button').find(
      (button) => button.text().includes('Descargar Excel'),
    );

    expect(downloadButton).toBeDefined();
    expect(downloadButton!.attributes('disabled')).toBeUndefined();

    await downloadButton!.trigger('click');
    await flushPromises();

    expect(fetchPurchaseReport).toHaveBeenCalledWith(
      'token-prueba',
      'SMALL_TAXPAYER',
      expect.any(String),
      expect.any(String),
    );
  });
});
