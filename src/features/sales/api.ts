import { apiClient } from '@/services/apiClient';
import type { Sale, SaleCreatePayload, TaxConfiguration } from '@/features/sales/types';

/** GET /commercial/tax-configuration — tasa de IVA configurada por la empresa. */
export function fetchTaxConfiguration(): Promise<TaxConfiguration> {
  return apiClient.request<TaxConfiguration>('/api/v1/commercial/tax-configuration', {
    method: 'GET',
    auth: true,
  });
}

/** POST /commercial/sales — registra la venta; el backend calcula precios e impuesto. */
export function createSale(payload: SaleCreatePayload): Promise<Sale> {
  return apiClient.request<Sale>('/api/v1/commercial/sales', {
    method: 'POST',
    auth: true,
    body: payload,
  });
}

/** GET /commercial/sales/{id} — obtener una venta ya registrada. */
export function getSale(id: string): Promise<Sale> {
  return apiClient.request<Sale>(`/api/v1/commercial/sales/${id}`, {
    method: 'GET',
    auth: true,
  });
}
