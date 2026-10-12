import { describe, expect, it } from 'vitest';

import {
  buildPurchaseReportParams,
} from '@/features/reports/utils/purchaseReportParams';

describe('SCRUM-601: filtros del Libro de Compras', () => {
  it('genera los parámetros del período seleccionado', () => {
    const params = buildPurchaseReportParams(
      'GENERAL_VAT',
      '2026-10-01',
      '2026-10-31',
    );

    expect(params.get('regime')).toBe('GENERAL_VAT');
    expect(params.get('period')).toBe('custom');
    expect(params.get('start_date')).toBe('2026-10-01');
    expect(params.get('end_date')).toBe('2026-10-31');
  });

  it('admite el régimen de pequeño contribuyente', () => {
    const params = buildPurchaseReportParams(
      'SMALL_TAXPAYER',
      '2026-09-01',
      '2026-09-30',
    );

    expect(params.get('regime')).toBe('SMALL_TAXPAYER');
  });

  it('rechaza fechas invertidas', () => {
    expect(() =>
      buildPurchaseReportParams(
        'GENERAL_VAT',
        '2026-10-31',
        '2026-10-01',
      ),
    ).toThrow('El rango de fechas no es válido.');
  });

  it('rechaza fechas vacías', () => {
    expect(() =>
      buildPurchaseReportParams(
        'GENERAL_VAT',
        '',
        '',
      ),
    ).toThrow('El rango de fechas no es válido.');
  });
});