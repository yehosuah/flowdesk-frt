import type { Handler } from '@netlify/functions';

const API_BASE = (
  process.env.API_BASE_URL ?? 'http://98.92.232.157'
).replace(/\/+$/, '');

const REQUEST_TIMEOUT_MS = 25000;

export const handler: Handler = async (event) => {
  const path = event.path.replace('/.netlify/functions/proxy', '');
  const url = `${API_BASE}${path}`;

  const authHeader =
    event.headers.authorization || event.headers.Authorization;

  const controller = new AbortController();

  const timeoutId = setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS,
  );

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      method: event.httpMethod,
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: ['GET', 'HEAD'].includes(event.httpMethod)
        ? undefined
        : (event.body ?? undefined),
    });

    const data = await response.text();

    return {
      statusCode: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
      body: data,
    };
  } catch {
    return {
      statusCode: 502,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        detail:
          'No fue posible conectar con el servidor. Intenta nuevamente.',
      }),
    };
  } finally {
    clearTimeout(timeoutId);
  }
};