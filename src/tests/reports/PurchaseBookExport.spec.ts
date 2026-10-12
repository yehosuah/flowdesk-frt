
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

describe('SCRUM-672: exportación del Libro de Compras', () => {
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

  async function selectDates(
    wrapper: ReturnType<typeof mountView>,
  ) {
    const calendars = wrapper.findAll('.date-picker');

    expect(calendars).toHaveLength(2);

    const startDay = calendars[0]
      .findAll('button.calendar-day')
      .find((button) => button.text() === '1');

    const endDay = calendars[1]
      .findAll('button.calendar-day')
      .find((button) => button.text() === '10');

    expect(startDay).toBeDefined();
    expect(endDay).toBeDefined();

    await startDay!.trigger('click');
    await endDay!.trigger('click');
  }

  function getDownloadButton(
    wrapper: ReturnType<typeof mountView>,
  ) {
    return wrapper.findAll('button').find(
      (button) =>
        button.text().includes('Descargar Excel'),
    );
  }

  it('permite seleccionar el Libro de Compras', async () => {
    const wrapper = mountView();

    await selectPurchaseBook(wrapper);

    expect(wrapper.text()).toContain('Libro de Compras');
    expect(wrapper.text()).toContain('Régimen Tributario');
  });

  it('muestra el botón de descarga Excel', async () => {
    const wrapper = mountView();

    await selectPurchaseBook(wrapper);

    expect(wrapper.text()).toContain(
      'Descargar Excel (.xlsx)',
    );
  });

  it('bloquea la descarga si no hay fechas', async () => {
    const wrapper = mountView();

    await selectPurchaseBook(wrapper);

    const button = getDownloadButton(wrapper);

    expect(button).toBeDefined();
    expect(button!.attributes('disabled')).toBeDefined();
  });

  it('permite seleccionar el régimen de pequeño contribuyente', async () => {
    const wrapper = mountView();

    await selectPurchaseBook(wrapper);

    const select = wrapper.get('#purchase-tax-regime');

    await select.setValue('SMALL_TAXPAYER');

    expect(
      (select.element as HTMLSelectElement).value,
    ).toBe('SMALL_TAXPAYER');
  });

  it('no realiza solicitudes si faltan fechas', async () => {
    const wrapper = mountView();

    await selectPurchaseBook(wrapper);

    const button = getDownloadButton(wrapper);

    expect(button!.attributes('disabled')).toBeDefined();
    expect(fetchPurchaseReport).not.toHaveBeenCalled();
  });

  it('mantiene disponibles los reportes existentes', async () => {
    const wrapper = mountView();

    expect(wrapper.text()).toContain(
      'Stock Actual Valorado',
    );

    const commercialButton = wrapper.findAll('button').find(
      (button) => button.text().includes('Comercial / Ventas'),
    );

    expect(commercialButton).toBeDefined();
    await commercialButton!.trigger('click');

    expect(wrapper.text()).toContain('Resumen de Ventas');
  });

  it('muestra las columnas configuradas del Libro de Compras', async () => {
    const wrapper = mountView();

    await selectPurchaseBook(wrapper);

    expect(wrapper.text()).toContain('Número Factura');
    expect(wrapper.text()).toContain('NIT Proveedor');
    expect(wrapper.text()).toContain('Total Compra');
  });

  it('envía las fechas y el régimen seleccionados al exportar', async () => {
    const wrapper = mountView();

    await selectPurchaseBook(wrapper);
    await selectDates(wrapper);

    const downloadButton = getDownloadButton(wrapper);

    expect(downloadButton).toBeDefined();
    expect(
      downloadButton!.attributes('disabled'),
    ).toBeUndefined();

    vi.mocked(fetchPurchaseReport).mockResolvedValue(
      new Response(null, { status: 403 }),
    );

    await downloadButton!.trigger('click');
    await flushPromises();

    expect(fetchPurchaseReport).toHaveBeenCalledOnce();

    expect(fetchPurchaseReport).toHaveBeenCalledWith(
      'token-prueba',
      'GENERAL_VAT',
      expect.stringMatching(/^\d{4}-\d{2}-01$/),
      expect.stringMatching(/^\d{4}-\d{2}-10$/),
    );
  });

  it('muestra un mensaje cuando el servidor rechaza la exportación', async () => {
    const wrapper = mountView();

    await selectPurchaseBook(wrapper);
    await selectDates(wrapper);

    vi.mocked(fetchPurchaseReport).mockResolvedValue(
      new Response(null, { status: 403 }),
    );

    const downloadButton = getDownloadButton(wrapper);

    expect(downloadButton).toBeDefined();

    await downloadButton!.trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain(
      'No tienes permisos para generar este reporte',
    );

    expect(wrapper.text()).not.toContain(
      'Descarga iniciada',
    );
  });
});
