export type TaxReportRegime =
  | 'SMALL_TAXPAYER'
  | 'GENERAL_VAT';

export function buildPurchaseReportParams(
  regime: TaxReportRegime,
  startDate: string,
  endDate: string,
): URLSearchParams {
  if (!startDate || !endDate || startDate > endDate) {
    throw new Error('El rango de fechas no es válido.');
  }

  return new URLSearchParams({
    regime,
    period: 'custom',
    start_date: startDate,
    end_date: endDate,
  });
}
