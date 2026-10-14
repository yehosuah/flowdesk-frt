import { apiClient } from '@/services/apiClient';
import type { TaxProfile, TaxProfileResponse } from './types';

/**
 * Perfil tributario estándar para Guatemala (Régimen General de IVA 12%).
 */
export const DEFAULT_GT_TAX_PROFILE: TaxProfile = {
  name: 'Régimen General IVA (12%)',
  description: 'Perfil tributario estándar de Guatemala con IVA 12%',
  jurisdiction: 'GT',
  regime: 'GENERAL_VAT',
  default_currency: 'GTQ',
  effective_from: '2026-01-01',
  effective_until: null,
  active: true,
  taxes: [
    {
      tax_code: 'IVA',
      name: 'Impuesto al Valor Agregado',
      tax_type: 'percentage',
      rate: 12,
      category: 'TAXABLE',
      active: true,
      eligible_for_input_credit: true,
    },
  ],
  rules: [],
  precision: 2,
  rounding: 'HALF_UP',
};

/**
 * Consulta los perfiles tributarios configurados para la empresa.
 * Endpoint: GET /api/v1/tax/profile
 */
export async function fetchTaxProfiles(): Promise<TaxProfileResponse> {
  return apiClient.request<TaxProfileResponse>('/api/v1/tax/profile', {
    method: 'GET',
    auth: true,
  });
}

/**
 * Actualiza o activa un perfil tributario en el backend.
 * Endpoint: PUT /api/v1/tax/profile
 */
export async function saveTaxProfile(profile: TaxProfile): Promise<any> {
  return apiClient.request('/api/v1/tax/profile', {
    method: 'PUT',
    auth: true,
    body: profile,
  });
}
