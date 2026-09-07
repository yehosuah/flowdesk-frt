import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from "vitest";

vi.mock("@/services/env", () => ({
  appEnv: {
    hasApiBaseUrl: true,
    apiBaseUrl: "http://localhost:8000",
    apiBaseUrlError: null,
  },
}));

const { appStoreMock } = vi.hoisted(() => ({
  appStoreMock: {
    accessToken: "token123" as string | null,
    clearSession: vi.fn(),
  },
}));

vi.mock("@/stores/app.store", () => ({
  appStore: appStoreMock,
}));

import {
  apiClient,
  ApiError,
  getApiErrorMessage,
} from "@/services/apiClient";

describe("ApiError", () => {
  it("crea correctamente una instancia", () => {
    const error = new ApiError(
      404,
      "No encontrado",
    );

    expect(error.status).toBe(404);
    expect(error.message).toBe(
      "No encontrado",
    );
    expect(error.name).toBe(
      "ApiError",
    );
  });
});

describe("getApiErrorMessage", () => {
  it("devuelve el mensaje de ApiError", () => {
    const error = new ApiError(
      400,
      "Error personalizado",
    );

    expect(
      getApiErrorMessage(error),
    ).toBe("Error personalizado");
  });

  it("devuelve el mensaje genérico", () => {
    expect(
      getApiErrorMessage(
        new Error(),
      ),
    ).toBe(
      "Ocurrio un error inesperado. Intenta de nuevo.",
    );
  });
});

describe("apiClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    appStoreMock.accessToken =
      "token123";

    appStoreMock.clearSession
      .mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("realiza una petición correctamente", async () => {
    const fetchMock = vi.fn(
      async (
        _url: RequestInfo | URL,
        _init?: RequestInit,
      ) => {
        return {
          ok: true,
          status: 200,
          text: async () =>
            JSON.stringify({
              success: true,
            }),
        } as Response;
      },
    );

    vi.stubGlobal(
      "fetch",
      fetchMock,
    );

    const response =
      await apiClient.request<{
        success: boolean;
      }>("/test");

    expect(
      response.success,
    ).toBe(true);

    expect(
      fetchMock,
    ).toHaveBeenCalledTimes(1);
  });

  it("agrega una señal de cancelación a la petición", async () => {
    const fetchMock = vi.fn(
      async (
        _url: RequestInfo | URL,
        _init?: RequestInit,
      ) => {
        return {
          ok: true,
          status: 200,
          text: async () =>
            JSON.stringify({
              success: true,
            }),
        } as Response;
      },
    );

    vi.stubGlobal(
      "fetch",
      fetchMock,
    );

    await apiClient.request(
      "/test",
    );

    expect(
      fetchMock,
    ).toHaveBeenCalledTimes(1);

    const requestInit =
      fetchMock.mock.calls[0]?.[1];

    expect(
      requestInit?.signal,
    ).toBeInstanceOf(
      AbortSignal,
    );

    expect(
      requestInit?.signal?.aborted,
    ).toBe(false);
  });

  it("lanza ApiError cuando el backend responde con error", async () => {
    const fetchMock = vi.fn(
      async () => {
        return {
          ok: false,
          status: 404,
          text: async () =>
            JSON.stringify({
              detail:
                "No encontrado",
            }),
        } as Response;
      },
    );

    vi.stubGlobal(
      "fetch",
      fetchMock,
    );

    await expect(
      apiClient.request("/test"),
    ).rejects.toMatchObject({
      status: 404,
      message: "No encontrado",
    });
  });

  it("lanza ApiError cuando falla la conexión", async () => {
    const fetchMock = vi.fn(
      async () => {
        throw new Error(
          "Network Error",
        );
      },
    );

    vi.stubGlobal(
      "fetch",
      fetchMock,
    );

    await expect(
      apiClient.request("/test"),
    ).rejects.toMatchObject({
      status: 0,
      message:
        "No se pudo conectar con el backend. Verifica VITE_API_BASE_URL y confirma que el API este disponible.",
    });
  });

  it("requiere autenticación cuando auth es true y no hay token", async () => {
    appStoreMock.accessToken =
      null;

    await expect(
      apiClient.request(
        "/test",
        {
          auth: true,
        },
      ),
    ).rejects.toMatchObject({
      status: 401,
      message:
        "No hay una sesion activa para completar esta solicitud.",
    });
  });

  it("agrega el token cuando la petición requiere autenticación", async () => {
    const fetchMock = vi.fn(
      async (
        _url: RequestInfo | URL,
        init?: RequestInit,
      ) => {
        const headers =
          new Headers(
            init?.headers,
          );

        expect(
          headers.get(
            "Authorization",
          ),
        ).toBe(
          "Bearer token123",
        );

        return {
          ok: true,
          status: 200,
          text: async () =>
            JSON.stringify({
              success: true,
            }),
        } as Response;
      },
    );

    vi.stubGlobal(
      "fetch",
      fetchMock,
    );

    await apiClient.request(
      "/test",
      {
        auth: true,
      },
    );

    expect(
      fetchMock,
    ).toHaveBeenCalledTimes(1);
  });

  it("limpia la sesión cuando el backend responde 401", async () => {
    const fetchMock = vi.fn(
      async () => {
        return {
          ok: false,
          status: 401,
          text: async () =>
            JSON.stringify({
              detail:
                "Token inválido o expirado",
            }),
        } as Response;
      },
    );

    vi.stubGlobal(
      "fetch",
      fetchMock,
    );

    await expect(
      apiClient.request(
        "/test",
        {
          auth: true,
        },
      ),
    ).rejects.toMatchObject({
      status: 401,
    });

    expect(
      appStoreMock.clearSession,
    ).toHaveBeenCalledTimes(1);
  });

  it(
    "cancela la petición cuando supera el tiempo máximo de espera",
    async () => {
      const fetchMock = vi.fn(
        (
          _url: RequestInfo | URL,
          init?: RequestInit,
        ) => {
          return new Promise<Response>(
            (
              _resolve,
              reject,
            ) => {
              const signal =
                init?.signal;

              if (!signal) {
                reject(
                  new Error(
                    "No se recibió AbortSignal",
                  ),
                );

                return;
              }

              signal.addEventListener(
                "abort",
                () => {
                  reject(
                    new DOMException(
                      "La petición fue abortada",
                      "AbortError",
                    ),
                  );
                },
                {
                  once: true,
                },
              );
            },
          );
        },
      );

      vi.stubGlobal(
        "fetch",
        fetchMock,
      );

      const startedAt =
        Date.now();

      await expect(
        apiClient.request(
          "/test-timeout",
          {
            timeoutMs: 25,
          },
        ),
      ).rejects.toMatchObject({
        status: 408,
        message:
          "La solicitud tardo demasiado tiempo. Intenta de nuevo.",
      });

      const elapsed =
        Date.now() - startedAt;

      expect(
        elapsed,
      ).toBeLessThan(1000);

      expect(
        fetchMock,
      ).toHaveBeenCalledTimes(1);

      const requestInit =
        fetchMock.mock.calls[0]?.[1];

      expect(
        requestInit?.signal,
      ).toBeInstanceOf(
        AbortSignal,
      );

      expect(
        requestInit?.signal?.aborted,
      ).toBe(true);
    },
    2000,
  );

  it(
    "respeta un tiempo máximo personalizado por petición",
    async () => {
      const fetchMock = vi.fn(
        (
          _url: RequestInfo | URL,
          init?: RequestInit,
        ) => {
          return new Promise<Response>(
            (
              _resolve,
              reject,
            ) => {
              const signal =
                init?.signal;

              if (!signal) {
                reject(
                  new Error(
                    "No se recibió AbortSignal",
                  ),
                );

                return;
              }

              signal.addEventListener(
                "abort",
                () => {
                  reject(
                    new DOMException(
                      "La petición fue abortada",
                      "AbortError",
                    ),
                  );
                },
                {
                  once: true,
                },
              );
            },
          );
        },
      );

      vi.stubGlobal(
        "fetch",
        fetchMock,
      );

      const startedAt =
        Date.now();

      await expect(
        apiClient.request(
          "/test-timeout",
          {
            timeoutMs: 50,
          },
        ),
      ).rejects.toMatchObject({
        status: 408,
        message:
          "La solicitud tardo demasiado tiempo. Intenta de nuevo.",
      });

      const elapsed =
        Date.now() - startedAt;

      expect(
        elapsed,
      ).toBeGreaterThanOrEqual(
        40,
      );

      expect(
        elapsed,
      ).toBeLessThan(1000);

      expect(
        fetchMock,
      ).toHaveBeenCalledTimes(1);

      const requestInit =
        fetchMock.mock.calls[0]?.[1];

      expect(
        requestInit?.signal,
      ).toBeInstanceOf(
        AbortSignal,
      );

      expect(
        requestInit?.signal?.aborted,
      ).toBe(true);
    },
    2000,
  );

  it("permite cancelar una petición mediante una señal externa", async () => {
    const externalController =
      new AbortController();

    const fetchMock = vi.fn(
      (
        _url: RequestInfo | URL,
        init?: RequestInit,
      ) => {
        return new Promise<Response>(
          (
            _resolve,
            reject,
          ) => {
            const signal =
              init?.signal;

            if (!signal) {
              reject(
                new Error(
                  "No se recibió AbortSignal",
                ),
              );

              return;
            }

            signal.addEventListener(
              "abort",
              () => {
                reject(
                  new DOMException(
                    "La petición fue abortada",
                    "AbortError",
                  ),
                );
              },
              {
                once: true,
              },
            );
          },
        );
      },
    );

    vi.stubGlobal(
      "fetch",
      fetchMock,
    );

    const requestPromise =
      apiClient.request(
        "/test-cancel",
        {
          timeoutMs: 1000,
          signal:
            externalController.signal,
        },
      );

    externalController.abort();

    await expect(
      requestPromise,
    ).rejects.toMatchObject({
      status: 0,
      message:
        "La solicitud fue cancelada.",
    });

    expect(
      fetchMock,
    ).toHaveBeenCalledTimes(1);

    const requestInit =
      fetchMock.mock.calls[0]?.[1];

    expect(
      requestInit?.signal,
    ).toBeInstanceOf(
      AbortSignal,
    );

    expect(
      requestInit?.signal?.aborted,
    ).toBe(true);
  });
});