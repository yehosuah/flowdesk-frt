
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';

import TaxDashboardView from '@/features/taxation/views/TaxDashboardView.vue';
import { fetchTaxPeriodMetrics } from '@/features/taxation/api';

vi.mock('@/features/taxation/api', () => ({
  fetchTaxPeriodMetrics: vi.fn(),
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

describe('SCRUM-671: exportación del Libro de Ventas', () => {
  const metrics = {
    tax_debit: 1200,
    tax_credit: 450,
    net_tax: 750,
    tax_payable: 750,
    carry_forward: 0,
    withholding_tax: 150,
    input_documents_count: 18,
  };

  const createObjectURLMock = vi.fn(
    () => 'blob:http://localhost/reporte',
  );

  const revokeObjectURLMock = vi.fn();
  const fetchMock = vi.fn();

  let clickSpy: ReturnType<typeof vi.spyOn>;
  let downloadedName = '';

  beforeEach(() => {
    vi.clearAllMocks();
    downloadedName = '';

    vi.mocked(fetchTaxPeriodMetrics).mockResolvedValue(metrics);

    vi.stubGlobal('fetch', fetchMock);

    vi.stubGlobal(
      'URL',
      Object.assign(URL, {
        createObjectURL: createObjectURLMock,
        revokeObjectURL: revokeObjectURLMock,
      }),
    );

    clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function (this: HTMLAnchorElement) {
        downloadedName = this.download;
      });
  });

  afterEach(() => {
    clickSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  async function mountDashboard() {
    const wrapper = mount(TaxDashboardView);
    await flushPromises();
    return wrapper;
  }

  function exportButton(
    wrapper: Awaited<ReturnType<typeof mountDashboard>>,
  ) {
    return wrapper.findAll('button').find(
      (button) => button.text().includes('Exportar Libro'),
    );
  }

  function mockExcelResponse() {
    fetchMock.mockResolvedValue(
      new Response(
        new Blob(['archivo-xlsx-prueba'], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
        { status: 200 },
      ),
    );
  }

  it('muestra el botón Exportar Libro', async () => {
    const wrapper = await mountDashboard();

    expect(exportButton(wrapper)).toBeDefined();
  });

  it('envía una solicitud al endpoint tributario', async () => {
    mockExcelResponse();

    const wrapper = await mountDashboard();
    await exportButton(wrapper)!.trigger('click');
    await flushPromises();

    expect(fetchMock).toHaveBeenCalledOnce();

    const [url] = fetchMock.mock.calls[0];

    expect(url).toContain('/api/v1/reports/tributario');
    expect(url).toContain('regime=GENERAL_VAT');
  });

  it('incluye el token de autenticación', async () => {
    mockExcelResponse();

    const wrapper = await mountDashboard();
    await exportButton(wrapper)!.trigger('click');
    await flushPromises();

    const [, options] = fetchMock.mock.calls[0];

    expect(options.headers.Authorization).toBe(
      'Bearer token-prueba',
    );
  });

  it('descarga un archivo con extensión XLSX', async () => {
    mockExcelResponse();

    const wrapper = await mountDashboard();
    await exportButton(wrapper)!.trigger('click');
    await flushPromises();

    expect(downloadedName).toMatch(
      /^reporte_tributario_\d{4}\.xlsx$/,
    );
    expect(clickSpy).toHaveBeenCalledOnce();
  });

  it('genera y libera la URL temporal', async () => {
    mockExcelResponse();

    const wrapper = await mountDashboard();
    await exportButton(wrapper)!.trigger('click');
    await flushPromises();

    expect(createObjectURLMock).toHaveBeenCalledOnce();
    expect(revokeObjectURLMock).toHaveBeenCalledWith(
      'blob:http://localhost/reporte',
    );
  });

  it('muestra Exportando mientras procesa la solicitud', async () => {
    fetchMock.mockReturnValue(new Promise(() => {}));

    const wrapper = await mountDashboard();
    await exportButton(wrapper)!.trigger('click');

    expect(wrapper.text()).toContain('Exportando...');
  });

  it('restablece el botón al finalizar la exportación', async () => {
    mockExcelResponse();

    const wrapper = await mountDashboard();
    await exportButton(wrapper)!.trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('Exportar Libro');
    expect(wrapper.text()).not.toContain('Exportando...');
  });

  it('genera un CSV de contingencia si falla el servidor', async () => {
    fetchMock.mockResolvedValue(
      new Response(null, { status: 500 }),
    );

    const wrapper = await mountDashboard();
    await exportButton(wrapper)!.trigger('click');
    await flushPromises();

    expect(downloadedName).toMatch(
      /^resumen_fiscal_\d{4}_\d+\.csv$/,
    );

    expect(createObjectURLMock).toHaveBeenCalledOnce();
    expect(clickSpy).toHaveBeenCalledOnce();
  });
});
