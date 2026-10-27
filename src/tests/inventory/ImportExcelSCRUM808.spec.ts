
import {
  beforeEach,
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

const mocks = vi.hoisted(() => ({
  accessToken: 'token-prueba' as string | null,
  apiBaseUrl: 'https://api.flowdesk.test',
}));

vi.mock('@/stores/app.store', () => ({
  appStore: {
    get accessToken() {
      return mocks.accessToken;
    },
  },
}));

vi.mock('@/services/env', () => ({
  appEnv: {
    apiBaseUrl: mocks.apiBaseUrl,
  },
}));

import {
  importProductsExcel,
} from '@/features/inventory/import';

import {
  ApiError,
} from '@/services/apiClient';

function createExcelFile(): File {
  return new File(
    ['contenido-simulado'],
    'productos.xlsx',
    {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
  );
}

function mockResponse(
  status: number,
  payload: unknown,
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: vi.fn().mockResolvedValue(
      JSON.stringify(payload),
    ),
  } as unknown as Response;
}

describe('SCRUM-808: Importación Excel', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mocks.accessToken = 'token-prueba';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('envía un archivo Excel mediante POST', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      mockResponse(200, {
        inserted: 2,
        products: [],
      }),
    );

    vi.stubGlobal('fetch', fetchMock);

    await importProductsExcel(createExcelFile());

    expect(fetchMock).toHaveBeenCalledTimes(1);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.flowdesk.test/api/v1/inventory/products/import',
      expect.objectContaining({
        method: 'POST',
      }),
    );
  });

  it('envía el archivo dentro de FormData', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      mockResponse(200, {
        inserted: 1,
        products: [],
      }),
    );

    vi.stubGlobal('fetch', fetchMock);

    const file = createExcelFile();

    await importProductsExcel(file);

    const requestOptions = fetchMock.mock.calls[0][1] as RequestInit;

    expect(requestOptions.body).toBeInstanceOf(FormData);

    const formData = requestOptions.body as FormData;
    const uploadedFile = formData.get('file');

    expect(uploadedFile).toBeInstanceOf(File);
    expect((uploadedFile as File).name).toBe('productos.xlsx');
  });

  it('incluye el token de autenticación', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      mockResponse(200, {
        inserted: 1,
        products: [],
      }),
    );

    vi.stubGlobal('fetch', fetchMock);

    await importProductsExcel(createExcelFile());

    const requestOptions = fetchMock.mock.calls[0][1] as RequestInit;

    expect(requestOptions.headers).toMatchObject({
      Authorization: 'Bearer token-prueba',
    });
  });

  it('no establece manualmente Content-Type para FormData', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      mockResponse(200, {
        inserted: 1,
        products: [],
      }),
    );

    vi.stubGlobal('fetch', fetchMock);

    await importProductsExcel(createExcelFile());

    const requestOptions = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = requestOptions.headers as Record<string, string>;

    expect(headers['Content-Type']).toBeUndefined();
  });

  it('rechaza la importación cuando no existe sesión', async () => {
    mocks.accessToken = null;

    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      importProductsExcel(createExcelFile()),
    ).rejects.toMatchObject({
      status: 401,
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('devuelve la cantidad de productos importados', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      mockResponse(200, {
        inserted: 3,
        products: [],
      }),
    );

    vi.stubGlobal('fetch', fetchMock);

    const result = await importProductsExcel(createExcelFile());

    expect(result.inserted).toBe(3);
    expect(result.products).toEqual([]);
  });

  it('maneja errores HTTP del backend', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      mockResponse(500, {
        detail: 'Error interno del servidor',
      }),
    );

    vi.stubGlobal('fetch', fetchMock);

    await expect(
      importProductsExcel(createExcelFile()),
    ).rejects.toMatchObject({
      status: 500,
      message: 'Error interno del servidor',
    });
  });

  it('muestra información de filas inválidas', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      mockResponse(422, {
        message: 'El archivo contiene errores',
        errors: [
          {
            row: 2,
            column: 'precio_venta',
            message: 'Precio inválido',
          },
        ],
      }),
    );

    vi.stubGlobal('fetch', fetchMock);

    await expect(
      importProductsExcel(createExcelFile()),
    ).rejects.toThrow(/Fila 2.*precio_venta.*Precio inválido/);
  });

  it('maneja respuestas de error sin JSON válido', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      text: vi.fn().mockResolvedValue(
        'Bad Gateway',
      ),
    } as unknown as Response);

    vi.stubGlobal('fetch', fetchMock);

    await expect(
      importProductsExcel(createExcelFile()),
    ).rejects.toBeInstanceOf(ApiError);
  });
});
