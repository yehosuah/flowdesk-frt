
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import type { HandlerEvent } from '@netlify/functions';

import { handler } from '../../../netlify/functions/proxy';

const fetchMock = vi.fn();

function createEvent(
  overrides: Partial<HandlerEvent> = {},
): HandlerEvent {
  return {
    path:
      '/.netlify/functions/proxy/api/v1/inventory/products/import',
    httpMethod: 'POST',
    headers: {
      'content-type':
        'multipart/form-data; boundary=FlowDeskTest',
      authorization: 'Bearer token-prueba',
    },
    body: '',
    isBase64Encoded: false,
    ...overrides,
  } as HandlerEvent;
}

async function executeProxy(event: HandlerEvent) {
  return handler(
    event,
    {} as Parameters<typeof handler>[1],
  );
}

function getRequestOptions(): RequestInit {
  expect(fetchMock).toHaveBeenCalledTimes(1);

  return fetchMock.mock.calls[0][1] as RequestInit;
}

describe('SCRUM-731: Manejo de archivos base64', () => {
  beforeEach(() => {
    vi.stubEnv(
      'API_BASE_URL',
      'https://backend.example.test',
    );

    fetchMock.mockReset();

    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          inserted: 1,
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

  it('decodifica correctamente un cuerpo base64', async () => {
    const original = Buffer.from(
      'contenido-binario-de-prueba',
    );

    const event = createEvent({
      body: original.toString('base64'),
      isBase64Encoded: true,
    });

    await executeProxy(event);

    const options = getRequestOptions();

    expect(options.body).toBeInstanceOf(ArrayBuffer);

    expect(
      Buffer.from(options.body as ArrayBuffer),
    ).toEqual(original);
  });

  it('conserva los bytes binarios de un archivo XLSX', async () => {
    const original = Buffer.from([
      0x50,
      0x4b,
      0x03,
      0x04,
      0x00,
      0xff,
      0x80,
      0x7f,
    ]);

    const event = createEvent({
      body: original.toString('base64'),
      isBase64Encoded: true,
    });

    await executeProxy(event);

    const options = getRequestOptions();

    expect(options.body).toBeInstanceOf(ArrayBuffer);

    expect(
      Buffer.from(options.body as ArrayBuffer),
    ).toEqual(original);
  });

  it('conserva solicitudes JSON sin decodificarlas', async () => {
    const original = JSON.stringify({
      title: 'Nueva tarea',
    });

    const event = createEvent({
      path:
        '/.netlify/functions/proxy/api/v1/tasks',
      headers: {
        'content-type': 'application/json',
      },
      body: original,
      isBase64Encoded: false,
    });

    await executeProxy(event);

    const options = getRequestOptions();

    expect(options.body).toBe(original);

    expect(options.headers).toMatchObject({
      'Content-Type': 'application/json',
    });
  });

  it('conserva Content-Type y Authorization', async () => {
    const original = Buffer.from('archivo');

    const event = createEvent({
      body: original.toString('base64'),
      isBase64Encoded: true,
    });

    await executeProxy(event);

    const options = getRequestOptions();

    expect(options.headers).toMatchObject({
      'Content-Type':
        'multipart/form-data; boundary=FlowDeskTest',
      Authorization: 'Bearer token-prueba',
    });
  });

  it('no envía cuerpo en solicitudes GET', async () => {
    const event = createEvent({
      httpMethod: 'GET',
      body: Buffer.from('datos').toString('base64'),
      isBase64Encoded: true,
    });

    await executeProxy(event);

    const options = getRequestOptions();

    expect(options.body).toBeUndefined();
    expect(options.method).toBe('GET');
  });

  it('no envía cuerpo en solicitudes HEAD', async () => {
    const event = createEvent({
      httpMethod: 'HEAD',
      body: Buffer.from('datos').toString('base64'),
      isBase64Encoded: true,
    });

    await executeProxy(event);

    const options = getRequestOptions();

    expect(options.body).toBeUndefined();
    expect(options.method).toBe('HEAD');
  });

  it('conserva la respuesta exitosa del backend', async () => {
    const original = Buffer.from('archivo');

    const event = createEvent({
      body: original.toString('base64'),
      isBase64Encoded: true,
    });

    const result = await executeProxy(event);

    expect(result).toMatchObject({
      statusCode: 200,
      body: JSON.stringify({
        inserted: 1,
        products: [],
      }),
    });
  });
});
