import { apiClient } from '@/services/apiClient';
import type { TaxPeriodMetrics, TaxProfile, TaxProfileResponse } from './types';

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

export interface CommercialTaxConfiguration {
  tasa_impuesto: number | string;
}

export function fetchCommercialTaxConfiguration(): Promise<CommercialTaxConfiguration> {
  return apiClient.request('/api/v1/commercial/tax-configuration', { method: 'GET', auth: true });
}

export function updateCommercialTaxConfiguration(tasa_impuesto: number): Promise<CommercialTaxConfiguration> {
  return apiClient.request('/api/v1/commercial/tax-configuration', {
    method: 'PUT', auth: true, body: { tasa_impuesto },
  });
}

export * from './profileApi';

