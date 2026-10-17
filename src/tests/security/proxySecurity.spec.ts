
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

function createEvent(): HandlerEvent {
  return {
    path: '/.netlify/functions/proxy/api/v1/inventory',
    httpMethod: 'GET',
    headers: {},
    body: null,
  } as HandlerEvent;
}

async function executeProxy() {
  return handler(
    createEvent(),
    {} as Parameters<typeof handler>[1],
  );
}

describe('Seguridad del proxy de Netlify', () => {
  beforeEach(() => {
    vi.stubEnv(
      'API_BASE_URL',
      'https://backend.example.test',
    );

    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('mantiene las respuestas exitosas del backend', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ products: [] }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    );

    const result = await executeProxy();

    expect(result).toMatchObject({
      statusCode: 200,
      body: JSON.stringify({ products: [] }),
    });
  });

  it('devuelve 502 cuando falla la conexión', async () => {
    fetchMock.mockRejectedValue(
      new Error('ECONNREFUSED: conexión interna'),
    );

    const result = await executeProxy();

    expect(result).toMatchObject({
      statusCode: 502,
      body: JSON.stringify({
        detail:
          'No fue posible conectar con el servidor. Intenta nuevamente.',
      }),
    });
  });

  it('no expone información interna del servidor', async () => {
    fetchMock.mockRejectedValue(
      new Error('Error interno: /etc/secrets/backend.env'),
    );

    const result = await executeProxy();
    const body = JSON.stringify(result);

    expect(result).toMatchObject({ statusCode: 502 });
    expect(body).not.toContain('/etc/secrets/');
    expect(body).not.toContain('backend.env');
    expect(body).not.toContain('Error interno');
  });

  it('conserva el estado HTTP del backend', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ detail: 'No encontrado' }),
        { status: 404 },
      ),
    );

    const result = await executeProxy();

    expect(result).toMatchObject({
      statusCode: 404,
      body: JSON.stringify({
        detail: 'No encontrado',
      }),
    });
  });

  it('devuelve 503 cuando falta API_BASE_URL', async () => {
    vi.stubEnv('API_BASE_URL', '');

    const result = await executeProxy();

    expect(result).toMatchObject({ statusCode: 503 });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(JSON.stringify(result)).not.toContain(
      'backend.example.test',
    );
  });

  it('rechaza una URL de backend inválida', async () => {
    vi.stubEnv('API_BASE_URL', 'direccion-invalida');

    const result = await executeProxy();

    expect(result).toMatchObject({ statusCode: 503 });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
