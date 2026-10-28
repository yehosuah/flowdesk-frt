
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  ApiError,
  apiClient,
  getApiErrorMessage,
} from '@/services/apiClient';

import { i18n } from '@/i18n';

describe('SCRUM-766: Traducción de errores del backend', () => {
  afterEach(() => {
    i18n.global.locale.value = 'es';
    vi.unstubAllGlobals();
  });

  it('traduce errores de validación al español', () => {
    i18n.global.locale.value = 'es';

    const error = new ApiError(
      422,
      'Invalid request format',
      'validation_error',
    );

    expect(getApiErrorMessage(error)).toBe(
      'Los datos ingresados no son válidos',
    );
  });

  it('traduce errores de validación al inglés', () => {
    i18n.global.locale.value = 'en';

    const error = new ApiError(
      422,
      'Invalid request format',
      'validation_error',
    );

    expect(getApiErrorMessage(error)).toBe(
      'The provided data is invalid',
    );
  });

  it('traduce errores de permisos', () => {
    i18n.global.locale.value = 'es';

    const error = new ApiError(
      403,
      'Permission denied',
      'permission_denied',
    );

    expect(getApiErrorMessage(error)).toBe(
      'No tienes permisos para realizar esta acción',
    );
  });

  it('traduce errores de recursos inexistentes', () => {
    i18n.global.locale.value = 'en';

    const error = new ApiError(
      404,
      'Not found',
      'not_found',
    );

    expect(getApiErrorMessage(error)).toBe(
      'The requested resource was not found',
    );
  });

  it('conserva el mensaje original para códigos desconocidos', () => {
    const error = new ApiError(
      400,
      'Error personalizado',
      'custom_error',
    );

    expect(getApiErrorMessage(error)).toBe(
      'Error personalizado',
    );
  });

  it('mantiene compatibilidad con errores sin código', () => {
    const error = new ApiError(
      400,
      'Error personalizado',
    );

    expect(getApiErrorMessage(error)).toBe(
      'Error personalizado',
    );
  });

  it('conserva el código del backend en ApiError', () => {
    const error = new ApiError(
      422,
      'Invalid request format',
      'validation_error',
    );

    expect(error.status).toBe(422);
    expect(error.code).toBe('validation_error');
    expect(error.message).toBe('Invalid request format');
  });

  it('traduce el código recibido desde una respuesta HTTP', async () => {
    i18n.global.locale.value = 'en';

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          message: 'Invalid request format',
          code: 'validation_error',
          errors: [],
        }),
        {
          status: 422,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    vi.stubGlobal('fetch', fetchMock);

    let capturedError: unknown;

    try {
      await apiClient.request('/test');
    } catch (error) {
      capturedError = error;
    }

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(capturedError).toBeInstanceOf(ApiError);

    const apiError = capturedError as ApiError;

    expect(apiError.status).toBe(422);
    expect(apiError.code).toBe('validation_error');

    expect(getApiErrorMessage(apiError)).toBe(
      'The provided data is invalid',
    );
  });
});
