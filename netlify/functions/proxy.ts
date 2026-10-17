
import type { Handler } from '@netlify/functions';

const REQUEST_TIMEOUT_MS = 25000;

const JSON_HEADERS = {
  'Content-Type': 'application/json',
};

function getApiBaseUrl(): string | null {
  const configuredUrl = process.env.API_BASE_URL?.trim();

  if (!configuredUrl) {
    return null;
  }

  try {
    const url = new URL(configuredUrl);

    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    ) {
      return null;
    }

    return url.toString().replace(/\/+$/, '');
  } catch {
    return null;
  }
}

export const handler: Handler = async (event) => {
  const apiBase = getApiBaseUrl();

  if (!apiBase) {
    return {
      statusCode: 503,
      headers: JSON_HEADERS,
      body: JSON.stringify({
        detail: 'El servicio no está disponible temporalmente.',
      }),
    };
  }

  const path = event.path.replace(
    /^\/\.netlify\/functions\/proxy/,
    '',
  );

  const url = `${apiBase}${path}`;

  const authHeader =
    event.headers.authorization ||
    event.headers.Authorization;

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
      headers: JSON_HEADERS,
      body: data,
    };
  } catch {
    return {
      statusCode: 502,
      headers: JSON_HEADERS,
      body: JSON.stringify({
        detail:
          'No fue posible conectar con el servidor. Intenta nuevamente.',
      }),
    };
  } finally {
    clearTimeout(timeoutId);
  }
};
