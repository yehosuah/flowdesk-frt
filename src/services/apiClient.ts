import type { BackendErrorResponse } from '@/features/auth/types';

import { appEnv } from '@/services/env';
import { appStore } from '@/stores/app.store';

const DEFAULT_REQUEST_TIMEOUT_MS = 15_000;

export class ApiError extends Error {
  status: number;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface RequestOptions extends Omit<RequestInit, 'body' | 'headers' | 'signal'> {
  auth?: boolean;
  body?: unknown;
  headers?: HeadersInit;
  timeoutMs?: number;
  signal?: AbortSignal;
}

function normalizeErrorMessage(payload: unknown): string | null {
  if (!payload) {
    return null;
  }

  if (typeof payload === 'string') {
    return payload;
  }

  const backendError = payload as BackendErrorResponse;

  if (typeof backendError.detail === 'string') {
    return backendError.detail;
  }

  if (typeof backendError.message === 'string') {
    return backendError.message;
  }

  if (backendError.errors && typeof backendError.errors === 'object') {
    const entries = Object.values(backendError.errors).flatMap((value) =>
      Array.isArray(value) ? value : [value],
    );

    const firstError = entries.find((value) => typeof value === 'string');
    return typeof firstError === 'string' ? firstError : null;
  }

  return null;
}

async function parseResponse(response: Response): Promise<unknown> {
  const responseText = await response.text();

  if (!responseText) {
    return null;
  }

  try {
    return JSON.parse(responseText) as unknown;
  } catch {
    return responseText;
  }
}

function buildUrl(path: string): string {
  if (!appEnv.hasApiBaseUrl) {
    throw new ApiError(
      500,
      appEnv.apiBaseUrlError ??
        'No se encontro configuracion para la URL base del backend.',
    );
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const baseUrl = appEnv.apiBaseUrl.replace(/\/+$/, '');

  if (!baseUrl) {
    return normalizedPath;
  }

  if (import.meta.env.PROD && baseUrl === '/api') {
    return `${baseUrl}${normalizedPath}`;
  }

  return `${baseUrl}${normalizedPath}`;
}

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  return 'Ocurrio un error inesperado. Intenta de nuevo.';
}

export const apiClient = {
  async request<T>(
    path: string,
    options: RequestOptions = {},
  ): Promise<T> {
    const {
      timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
      signal: externalSignal,
      ...requestOptions
    } = options;

    const headers = new Headers(requestOptions.headers ?? {});
    headers.set('Accept', 'application/json');

    const isFormData = requestOptions.body instanceof FormData;

    if (
      !isFormData &&
      requestOptions.body !== undefined &&
      requestOptions.body !== null
    ) {
      headers.set('Content-Type', 'application/json');
    }

    if (requestOptions.auth) {
      const accessToken = appStore.accessToken;

      if (!accessToken) {
        throw new ApiError(
          401,
          'No hay una sesion activa para completar esta solicitud.',
        );
      }

      headers.set('Authorization', `Bearer ${accessToken}`);
    }

    const controller = new AbortController();
    let timedOut = false;

    const timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);

    const handleExternalAbort = () => {
      controller.abort();
    };

    if (externalSignal) {
      if (externalSignal.aborted) {
        controller.abort();
      } else {
        externalSignal.addEventListener(
          'abort',
          handleExternalAbort,
          { once: true },
        );
      }
    }

    try {
      const requestBody: BodyInit | undefined =
        isFormData && requestOptions.body instanceof FormData
          ? requestOptions.body
          : requestOptions.body !== undefined && requestOptions.body !== null
            ? JSON.stringify(requestOptions.body)
            : undefined;

      const response = await fetch(buildUrl(path), {
        ...requestOptions,
        headers,
        body: requestBody,
        signal: controller.signal,
      });

      const responsePayload = await parseResponse(response);

      if (!response.ok) {
        const errorMessage =
          normalizeErrorMessage(responsePayload) ??
          `La solicitud fallo con estado ${response.status}.`;

        if (response.status === 401 && requestOptions.auth) {
          appStore.clearSession();
        }

        throw new ApiError(response.status, errorMessage);
      }

      return responsePayload as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      if (timedOut) {
        throw new ApiError(
          408,
          'La solicitud tardo demasiado tiempo. Intenta de nuevo.',
        );
      }

      if (
        error instanceof DOMException &&
        error.name === 'AbortError'
      ) {
        throw new ApiError(
          0,
          'La solicitud fue cancelada.',
        );
      }

      throw new ApiError(
        0,
        'No se pudo conectar con el backend. Verifica VITE_API_BASE_URL y confirma que el API este disponible.',
      );
    } finally {
      clearTimeout(timeoutId);

      externalSignal?.removeEventListener(
        'abort',
        handleExternalAbort,
      );
    }
  },
};