import { apiClient } from '@/services/apiClient';
import type { TaxPeriodMetrics } from './types';

export interface TaxPeriodCalculatePayload {
  start_date: string;
  end_date: string;
  prior_carry_forward?: number;
  include_details?: boolean;
}

/**
 * Consulta al backend el cálculo oficial del período tributario.
 * Endpoint: POST /api/v1/tax/period/calculate
 */
export async function fetchTaxPeriodMetrics(payload: TaxPeriodCalculatePayload): Promise<TaxPeriodMetrics> {
  return apiClient.request<TaxPeriodMetrics>('/api/v1/tax/period/calculate', {
    method: 'POST',
    auth: true,
    body: {
      start_date: payload.start_date,
      end_date: payload.end_date,
      prior_carry_forward: payload.prior_carry_forward ?? 0,
      include_details: payload.include_details ?? true,
    },
  });
}
