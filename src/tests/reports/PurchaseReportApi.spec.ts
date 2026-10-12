
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchPurchaseReport } from '@/features/reports/api';

describe('SCRUM-603: endpoint del Libro de Compras', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('envía el régimen y las fechas seleccionadas', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(null, { status: 200 }),
    );

    vi.stubGlobal('fetch', fetchMock);

    await fetchPurchaseReport(
      'token-prueba',
      'GENERAL_VAT',
      '2026-10-01',
      '2026-10-31',
    );

    expect(fetchMock).toHaveBeenCalledOnce();

    const [url, options] = fetchMock.mock.calls[0];

    const requestUrl = new URL(
      url,
      'http://localhost',
    );

    expect(requestUrl.pathname).toBe(
      '/api/v1/reports/tributario',
    );

    expect(requestUrl.searchParams.get('regime')).toBe(
      'GENERAL_VAT',
    );

    expect(requestUrl.searchParams.get('period')).toBe(
      'custom',
    );

    expect(requestUrl.searchParams.get('start_date')).toBe(
      '2026-10-01',
    );

    expect(requestUrl.searchParams.get('end_date')).toBe(
      '2026-10-31',
    );

    expect(options.headers.Authorization).toBe(
      'Bearer token-prueba',
    );
  });

  it('permite solicitar el régimen de pequeño contribuyente', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(null, { status: 200 }),
    );

    vi.stubGlobal('fetch', fetchMock);

    await fetchPurchaseReport(
      'token-prueba',
      'SMALL_TAXPAYER',
      '2026-09-01',
      '2026-09-30',
    );

    const [url] = fetchMock.mock.calls[0];

    expect(new URL(url, 'http://localhost')
      .searchParams.get('regime')).toBe('SMALL_TAXPAYER');
  });

  it('devuelve la respuesta HTTP del servidor', async () => {
    const response = new Response(null, { status: 200 });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));

    const result = await fetchPurchaseReport(
      'token-prueba',
      'GENERAL_VAT',
      '2026-10-01',
      '2026-10-31',
    );

    expect(result).toBe(response);
    expect(result.ok).toBe(true);
  });

  it('rechaza un rango de fechas inválido antes de solicitar', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      fetchPurchaseReport(
        'token-prueba',
        'GENERAL_VAT',
        '2026-10-31',
        '2026-10-01',
      ),
    ).rejects.toThrow('El rango de fechas no es válido.');

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
