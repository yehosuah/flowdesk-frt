
import type { Handler } from '@netlify/functions';

const REQUEST_TIMEOUT_MS = 25000;

const JSON_HEADERS = {
  'Content-Type': 'application/json',
};

function getApiBaseUrl(): URL | null {
  const configuredUrl = process.env.API_BASE_URL?.trim();

  if (!configuredUrl) {
    return null;
  }

  try {
    const url = new URL(configuredUrl);

    if (
      !['http:', 'https:'].includes(url.protocol) ||
      !url.hostname ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    ) {
      return null;
    }

    return url;
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
    /^\/\.netlify\/functions\/proxy(?=\/|$)/,
    '',
  );

  // Construir la URL sin permitir cambiar el host configurado.
  const url = new URL(apiBase.toString());

  const basePath = url.pathname.replace(/\/+$/, '');
  const requestPath = path.startsWith('/') ? path : `/${path}`;

  // Rechazar rutas que puedan alterar el destino del proxy.
  const segments = requestPath.split('/');

  if (
    requestPath.includes('\\') ||
    segments.some((segment) => {
      try {
        const decoded = decodeURIComponent(segment);
        return decoded === '.' || decoded === '..' ||
          decoded.includes('/') || decoded.includes('\\');
      } catch {
        return true;
      }
    })
  ) {
    return {
      statusCode: 400,
      headers: JSON_HEADERS,
      body: JSON.stringify({
        detail: 'La ruta solicitada no es válida.',
      }),
    };
  }

  url.pathname = `${basePath}${requestPath}`;

  // Conservar los parámetros simples y repetidos.
  const queryParams =
    event.multiValueQueryStringParameters ??
    event.queryStringParameters ??
    {};

  for (const [key, value] of Object.entries(queryParams)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        url.searchParams.append(key, item);
      }
    } else if (typeof value === 'string') {
      url.searchParams.append(key, value);
    }
  }

  const authHeader =
    event.headers.authorization ||
    event.headers.Authorization;

  const controller = new AbortController();

  const timeoutId = setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS,
  );

  try {
    const response = await fetch(url.toString(), {
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
