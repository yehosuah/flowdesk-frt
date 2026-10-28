
 // @vitest-environment node

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

const BOUNDARY = 'FlowDeskSCRUM737Boundary';

function createMultipartBody(excel: Buffer): Buffer {
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

function createEvent(body: Buffer): HandlerEvent {
  const path =
    '/.netlify/functions/proxy/api/v1/inventory/products/import';

  const contentType =
    `multipart/form-data; boundary=${BOUNDARY}`;

  return {
    path,
    rawUrl: `https://frontend.example.test${path}`,
    rawQuery: '',
    httpMethod: 'POST',

    headers: {
      'content-type': contentType,
      authorization: 'Bearer token-prueba',
    },

    multiValueHeaders: {
      'content-type': [contentType],
      authorization: ['Bearer token-prueba'],
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
  const result = await handler(
    event,
    {} as Parameters<typeof handler>[1],
  );

  if (!result) {
    throw new Error(
      'El proxy no devolvió una respuesta HTTP',
    );
  }

  return result;
}

describe('SCRUM-737: Validación del multipart reenviado', () => {
  beforeEach(() => {
    vi.stubEnv(
      'API_BASE_URL',
      'https://backend.example.test',
    );

    fetchMock.mockReset();

    fetchMock.mockImplementation(
      async (_url: string, options: RequestInit) => {
        // Inspeccionar los encabezados y el cuerpo
        // recibido por el backend simulado.
        const headers = new Headers(options.headers);

        const contentType = headers.get('content-type');

        expect(contentType).toBe(
          `multipart/form-data; boundary=${BOUNDARY}`,
        );

        expect(headers.get('authorization')).toBe(
          'Bearer token-prueba',
        );

        expect(options.body).toBeInstanceOf(ArrayBuffer);

        // Construir una solicitud HTTP real con los
        // datos que el proxy intenta reenviar.
        const request = new Request(
          'https://backend.example.test/api/v1/inventory/products/import',
          {
            method: 'POST',
            headers,
            body: options.body,
          },
        );

        let formData: FormData;

        try {
          formData = await request.formData();
        } catch (error) {
          console.error(
            'Error al interpretar multipart:',
            error,
          );

          throw error;
        }

        const file = formData.get('file');

        if (!file || typeof file === 'string') {
          return new Response(
            JSON.stringify({
              message: 'Missing file',
            }),
            {
              status: 422,
              headers: {
                'Content-Type': 'application/json',
              },
            },
          );
        }

        // Verificar que el archivo recibido
        // contiene exactamente los bytes originales.
        const receivedBytes = Buffer.from(
          await file.arrayBuffer(),
        );

        const originalBytes = readFileSync(fixturePath);

        expect(receivedBytes).toEqual(originalBytes);

        return new Response(
          JSON.stringify({
            filename: file.name,
            size: file.size,
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
          },
        );
      },
    );

    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('permite recuperar el archivo desde multipart', async () => {
    const excel = readFileSync(fixturePath);

    const multipart = createMultipartBody(excel);

    const result = await executeProxy(
      createEvent(multipart),
    );

    if (result.statusCode !== 200) {
      console.error(
        'Respuesta del proxy:',
        result.statusCode,
        result.body,
      );

      console.error(
        'Resultados de fetch:',
        fetchMock.mock.results,
      );
    }

    expect(result.statusCode).toBe(200);

    expect(
      JSON.parse(result.body ?? '{}'),
    ).toEqual({
      filename: 'productos-scrum732.xlsx',
      size: excel.length,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
