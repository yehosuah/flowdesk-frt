
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
    path: '/.netlify/functions/proxy/api/v1/inventory/products/import',
    httpMethod: 'POST',
    headers: {},
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

describe('SCRUM-730: Transferencia multipart/form-data', () => {
  beforeEach(() => {
    vi.stubEnv(
      'API_BASE_URL',
      'https://backend.example.test',
    );

    vi.stubGlobal('fetch', fetchMock);

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
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('conserva Content-Type multipart con su boundary', async () => {
    const boundary = '----FlowDeskBoundary123';

    const event = createEvent({
      headers: {
        'content-type': `multipart/form-data; boundary=${boundary}`,
      },
      body: 'contenido-multipart',
    });

    await executeProxy(event);

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const options = fetchMock.mock.calls[0][1] as RequestInit;

    expect(options.headers).toMatchObject({
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    });
  });

  it('conserva el encabezado Authorization', async () => {
    const event = createEvent({
      headers: {
        'content-type': 'multipart/form-data; boundary=test',
        authorization: 'Bearer token-prueba',
      },
    });

    await executeProxy(event);

    const options = fetchMock.mock.calls[0][1] as RequestInit;

    expect(options.headers).toMatchObject({
      Authorization: 'Bearer token-prueba',
    });
  });

  it('envía la solicitud multipart mediante POST', async () => {
    const event = createEvent({
      headers: {
        'content-type': 'multipart/form-data; boundary=test',
      },
      body: 'contenido-multipart',
    });

    await executeProxy(event);

    const options = fetchMock.mock.calls[0][1] as RequestInit;

    expect(options.method).toBe('POST');
    expect(options.body).toBe('contenido-multipart');
  });

  it('conserva Content-Type de solicitudes JSON', async () => {
    const event = createEvent({
      path: '/.netlify/functions/proxy/api/v1/tasks',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Nueva tarea',
      }),
    });

    await executeProxy(event);

    const options = fetchMock.mock.calls[0][1] as RequestInit;

    expect(options.headers).toMatchObject({
      'Content-Type': 'application/json',
    });
  });

  it('no fuerza application/json cuando no existe Content-Type', async () => {
    const event = createEvent({
      headers: {},
      body: 'contenido',
    });

    await executeProxy(event);

    const options = fetchMock.mock.calls[0][1] as RequestInit;

    expect(
      (options.headers as Record<string, string>)['Content-Type'],
    ).toBeUndefined();
  });

  it('conserva la respuesta exitosa del backend', async () => {
    const event = createEvent({
      headers: {
        'content-type': 'multipart/form-data; boundary=test',
      },
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
