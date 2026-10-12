import {
  buildPurchaseReportParams,
  type TaxReportRegime,
} from './utils/purchaseReportParams';

export async function fetchPurchaseReport(
  token: string,
  regime: TaxReportRegime,
  startDate: string,
  endDate: string,
): Promise<Response> {
  const params = buildPurchaseReportParams(
    regime,
    startDate,
    endDate,
  );

  const response = await fetch(
    `/api/v1/reports/tributario?${params.toString()}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return response;
}