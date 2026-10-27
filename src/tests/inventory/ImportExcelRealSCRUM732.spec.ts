
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import type { HandlerEvent } from '@netlify/functions';

import { handler } from '../../../netlify/functions/proxy';

const fetchMock = vi.fn();

const fixturePath = resolve(
  process.cwd(),
  'src/tests/fixtures/productos-scrum732.xlsx',
);

const BOUNDARY = 'FlowDeskSCRUM732Boundary';

function readExcel(): Buffer {
  return readFileSync(fixturePath);
}

function createMultipartBody(
  excel: Buffer,
): Buffer {
  const prefix = Buffer.from(
    `--${BOUNDARY}\r\n` +
      'Content-Disposition: form-data; name="file"; filename="productos-scrum732.xlsx"\r\n' +
      'Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n' +
      '\r\n',
    'utf8',
  );

  const suffix = Buffer.from(
    `\r\n--${BOUNDARY}--\r\n`,
    'utf8',
  );

  return Buffer.concat([
    prefix,
    excel,
    suffix,
  ]);
}

function createEvent(
  body: Buffer,
): HandlerEvent {
  const path =
    '/.netlify/functions/proxy/api/v1/inventory/products/import';

  const headers = {
    'content-type':
      `multipart/form-data; boundary=${BOUNDARY}`,
    authorization: 'Bearer token-prueba',
  };

  return {
    path,
    rawUrl: `https://frontend.example.test${path}`,
    rawQuery: '',
    httpMethod: 'POST',
    headers,
    multiValueHeaders: {
      'content-type': [headers['content-type']],
      authorization: [headers.authorization],
    },
    queryStringParameters: {},
    multiValueQueryStringParameters: {},
    body: body.toString('base64'),
    isBase64Encoded: true,
  };
}

async function executeProxy(
  event: HandlerEvent,
) {
  return handler(
    event,
    {} as Parameters<typeof handler>[1],
  );
}

function getRequestOptions(): RequestInit {
  expect(fetchMock).toHaveBeenCalledTimes(1);

  return fetchMock.mock.calls[0][1] as RequestInit;
}

describe('SCRUM-732: Importación con XLSX real', () => {
  beforeEach(() => {
    vi.stubEnv(
      'API_BASE_URL',
      'https://backend.example.test',
    );

    fetchMock.mockReset();

    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          inserted: 2,
          products: [],
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('utiliza un archivo XLSX real', () => {
    const excel = readExcel();

    expect(excel.length).toBeGreaterThan(100);

    // Un archivo XLSX es un contenedor ZIP.
    expect(excel.subarray(0, 4)).toEqual(
      Buffer.from([
        0x50,
        0x4b,
        0x03,
        0x04,
      ]),
    );
  });

  it('construye un cuerpo multipart con el archivo', () => {
    const excel = readExcel();

    const multipart = createMultipartBody(excel);

    expect(multipart.includes(excel)).toBe(true);

    expect(
      multipart.toString('latin1'),
    ).toContain(
      'filename="productos-scrum732.xlsx"',
    );

    expect(
      multipart.toString('latin1'),
    ).toContain(
      `--${BOUNDARY}`,
    );
  });

  it('conserva los bytes del multipart al pasar por el proxy', async () => {
    const multipart = createMultipartBody(
      readExcel(),
    );

    await executeProxy(
      createEvent(multipart),
    );

    const options = getRequestOptions();

    expect(
      options.body,
    ).toBeInstanceOf(ArrayBuffer);

    const forwarded = Buffer.from(
      options.body as ArrayBuffer,
    );

    expect(forwarded).toEqual(multipart);
  });

  it('conserva los bytes del Excel dentro del multipart', async () => {
    const excel = readExcel();

    const multipart = createMultipartBody(excel);

    await executeProxy(
      createEvent(multipart),
    );

    const options = getRequestOptions();

    const forwarded = Buffer.from(
      options.body as ArrayBuffer,
    );

    expect(
      forwarded.includes(excel),
    ).toBe(true);
  });

  it('conserva el encabezado multipart y su boundary', async () => {
    const multipart = createMultipartBody(
      readExcel(),
    );

    await executeProxy(
      createEvent(multipart),
    );

    expect(
      getRequestOptions().headers,
    ).toMatchObject({
      'Content-Type':
        `multipart/form-data; boundary=${BOUNDARY}`,
    });
  });

  it('conserva la autenticación Bearer', async () => {
    const multipart = createMultipartBody(
      readExcel(),
    );

    await executeProxy(
      createEvent(multipart),
    );

    expect(
      getRequestOptions().headers,
    ).toMatchObject({
      Authorization: 'Bearer token-prueba',
    });
  });

  it('envía el multipart mediante POST', async () => {
    const multipart = createMultipartBody(
      readExcel(),
    );

    await executeProxy(
      createEvent(multipart),
    );

    const options = getRequestOptions();

    expect(options.method).toBe('POST');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://backend.example.test/api/v1/inventory/products/import',
      expect.objectContaining({
        method: 'POST',
      }),
    );
  });

  it('conserva la respuesta del backend simulado', async () => {
    const multipart = createMultipartBody(
      readExcel(),
    );

    const result = await executeProxy(
      createEvent(multipart),
    );

    expect(result).toMatchObject({
      statusCode: 200,
      body: JSON.stringify({
        inserted: 2,
        products: [],
      }),
    });
  });
});
