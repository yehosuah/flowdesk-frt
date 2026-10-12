
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
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

describe('SCRUM-673: descarga de archivos del Libro de Compras', () => {
  const createObjectURLMock = vi.fn(
    () => 'blob:http://localhost/reporte-prueba',
  );
  const revokeObjectURLMock = vi.fn();
  let clickSpy: ReturnType<typeof vi.spyOn>;
  let downloadedName = '';

  const mockMetricsResponse = () =>
    new Response(
      new Blob(['contenido-xlsx-prueba'], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
      { status: 200 },
    );

  beforeEach(() => {
    vi.clearAllMocks();
    downloadedName = '';

    vi.stubGlobal(
      'URL',
      Object.assign(URL, {
        createObjectURL: createObjectURLMock,
        revokeObjectURL: revokeObjectURLMock,
      }),
    );

    clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function (this: HTMLAnchorElement) {
        downloadedName = this.download;
      });
  });

  afterEach(() => {
    clickSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  function mountView() {
    return mount(ReportsView);
  }

  async function prepareDownload(
    wrapper: ReturnType<typeof mountView>,
  ) {
    const commercialButton = wrapper.findAll('button').find(
      (button) => button.text().includes('Comercial / Ventas'),
    );

    await commercialButton!.trigger('click');

    const purchaseOption = wrapper.findAll('button').find(
      (button) => button.text() === 'Libro de Compras',
    );

    await purchaseOption!.trigger('click');

    const calendars = wrapper.findAll('.date-picker');

    const startDay = calendars[0]
      .findAll('button.calendar-day')
      .find((button) => button.text() === '1');

    const endDay = calendars[1]
      .findAll('button.calendar-day')
      .find((button) => button.text() === '10');

    await startDay!.trigger('click');
    await endDay!.trigger('click');
  }

  function getDownloadButton(
    wrapper: ReturnType<typeof mountView>,
  ) {
    return wrapper.findAll('button').find(
      (button) => button.text().includes('Descargar Excel'),
    );
  }

  async function triggerDownload(
    wrapper: ReturnType<typeof mountView>,
  ) {
    const button = getDownloadButton(wrapper);
    expect(button).toBeDefined();

    await button!.trigger('click');
    await flushPromises();
  }

  it('convierte la respuesta del servidor en un Blob', async () => {
    const blob = new Blob(['archivo-excel']);
    const blobSpy = vi.fn().mockResolvedValue(blob);

    vi.mocked(fetchPurchaseReport).mockResolvedValue({
      ok: true,
      blob: blobSpy,
    } as unknown as Response);

    const wrapper = mountView();
    await prepareDownload(wrapper);
    await triggerDownload(wrapper);

    expect(blobSpy).toHaveBeenCalledOnce();
    expect(createObjectURLMock).toHaveBeenCalledWith(blob);
  });

  it('genera una URL temporal para descargar el archivo', async () => {
    vi.mocked(fetchPurchaseReport).mockResolvedValue(
      mockMetricsResponse(),
    );

    const wrapper = mountView();
    await prepareDownload(wrapper);
    await triggerDownload(wrapper);

    expect(createObjectURLMock).toHaveBeenCalledOnce();
  });

  it('asigna un nombre de archivo con extensión XLSX', async () => {
    vi.mocked(fetchPurchaseReport).mockResolvedValue(
      mockMetricsResponse(),
    );

    const wrapper = mountView();
    await prepareDownload(wrapper);
    await triggerDownload(wrapper);

    expect(downloadedName).toMatch(
      /^reporte_tributario_\d{4}-\d{2}-01_\d{4}-\d{2}-10\.xlsx$/,
    );
  });

  it('inicia la descarga mediante un enlace temporal', async () => {
    vi.mocked(fetchPurchaseReport).mockResolvedValue(
      mockMetricsResponse(),
    );

    const wrapper = mountView();
    await prepareDownload(wrapper);
    await triggerDownload(wrapper);

    expect(clickSpy).toHaveBeenCalledOnce();
  });

  it('elimina el enlace temporal después de descargar', async () => {
    vi.mocked(fetchPurchaseReport).mockResolvedValue(
      mockMetricsResponse(),
    );

    const wrapper = mountView();
    await prepareDownload(wrapper);
    await triggerDownload(wrapper);

    expect(
      document.querySelector(
        'a[download^="reporte_tributario_"]',
      ),
    ).toBeNull();
  });

  it('libera la URL temporal después de descargar', async () => {
    vi.mocked(fetchPurchaseReport).mockResolvedValue(
      mockMetricsResponse(),
    );

    const wrapper = mountView();
    await prepareDownload(wrapper);
    await triggerDownload(wrapper);

    expect(revokeObjectURLMock).toHaveBeenCalledWith(
      'blob:http://localhost/reporte-prueba',
    );
  });

  it('no descarga archivos cuando el servidor devuelve un error', async () => {
    vi.mocked(fetchPurchaseReport).mockResolvedValue(
      new Response(null, { status: 403 }),
    );

    const wrapper = mountView();
    await prepareDownload(wrapper);
    await triggerDownload(wrapper);

    expect(createObjectURLMock).not.toHaveBeenCalled();
    expect(clickSpy).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain(
      'No tienes permisos para generar este reporte',
    );
  });

  it('no descarga archivos vacíos', async () => {
    vi.mocked(fetchPurchaseReport).mockResolvedValue(
      new Response(null, { status: 200 }),
    );

    const wrapper = mountView();
    await prepareDownload(wrapper);
    await triggerDownload(wrapper);

    expect(createObjectURLMock).not.toHaveBeenCalled();
    expect(clickSpy).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain(
      'El servidor devolvió un archivo vacío',
    );
  });

  it('restablece el botón después de completar la descarga', async () => {
    vi.mocked(fetchPurchaseReport).mockResolvedValue(
      mockMetricsResponse(),
    );

    const wrapper = mountView();
    await prepareDownload(wrapper);
    await triggerDownload(wrapper);

    const button = getDownloadButton(wrapper);

    expect(button!.attributes('disabled')).toBeUndefined();
    expect(button!.text()).toContain('Descargar Excel (.xlsx)');
    expect(wrapper.text()).toContain('Descarga iniciada');
  });
});