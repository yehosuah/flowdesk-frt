import { describe, expect, it } from 'vitest';
import { getPurchaseReportErrorMessage } from '@/features/reports/utils/purchaseReportErrors';

describe('SCRUM-607: errores del Libro de Compras', () => {
  it('explica cuando no existe sesión o expiró', () => {
    expect(getPurchaseReportErrorMessage('NO_SESSION')).toContain('sesión');
    expect(getPurchaseReportErrorMessage(401)).toContain('sesión');
  });

  it('distingue permisos insuficientes', () => {
    expect(getPurchaseReportErrorMessage(403)).toContain('permisos');
  });

  it('identifica parámetros inválidos', () => {
    expect(getPurchaseReportErrorMessage(422)).toContain('parámetros');
  });

  it('identifica fallos del servidor', () => {
    expect(getPurchaseReportErrorMessage(500)).toContain('servidor');
    expect(getPurchaseReportErrorMessage(503)).toContain('servidor');
  });

  it('identifica problemas de conexión y archivos vacíos', () => {
    expect(getPurchaseReportErrorMessage('NETWORK')).toContain('conexión');
    expect(getPurchaseReportErrorMessage('EMPTY_FILE')).toContain('archivo vacío');
  });

  it('ofrece mensaje genérico para otros estados', () => {
    expect(getPurchaseReportErrorMessage(404)).toContain('No se pudo descargar');
  });
});
