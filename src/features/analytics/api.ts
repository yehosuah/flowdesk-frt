import { apiClient } from '@/services/apiClient';

export type AnalyticsPeriod = '7d' | '30d' | '90d' | '6m' | '12m' | 'ytd' | 'custom';

export interface InventoryMetrics {
  period: AnalyticsPeriod;
  product_id: string | null;
  start_date: string;
  end_date: string;
  entradas: number;
  salidas: number;
  stock_bajo: number;
  sin_stock: number;
}

export interface TrendPoint {
  period_start: string;
  period_label: string;
  inbound_quantity: number;
  outbound_quantity: number;
  net_quantity: number;
  movement_count: number;
  ending_stock: number | null;
}

export interface TrendResponse {
  period: AnalyticsPeriod;
  window: 'day' | 'week' | 'month';
  product_id: string | null;
  start_date: string;
  end_date: string;
  points: TrendPoint[];
}

export interface ProductAnalyticsRow {
  product_id: string;
  sku: string;
  nombre: string;
  inbound_quantity: number;
  outbound_quantity: number;
  net_quantity: number;
  movement_count: number;
  ending_stock: number;
  stock_minimo: number;
  stock_risk_score: number;
}

export interface ProductAnalyticsResponse {
  period: AnalyticsPeriod;
  sort_by: string;
  start_date: string;
  end_date: string;
  products: ProductAnalyticsRow[];
}

export function fetchMetrics(period: AnalyticsPeriod = '30d', startDate?: string, endDate?: string): Promise<InventoryMetrics> {
  let url = `/api/v1/inventory/metrics?period=${period}`;
  if (period === 'custom' && startDate && endDate) {
    url += `&start_date=${startDate}&end_date=${endDate}`;
  }
  return apiClient.request<InventoryMetrics>(url, { method: 'GET', auth: true });
}

export function fetchTrend(
  period: AnalyticsPeriod = '30d',
  window: 'day' | 'week' | 'month' = 'day',
  startDate?: string,
  endDate?: string
): Promise<TrendResponse> {
  let url = `/api/v1/inventory/analytics/trend?period=${period}&window=${window}`;
  if (period === 'custom' && startDate && endDate) {
    url += `&start_date=${startDate}&end_date=${endDate}`;
  }
  return apiClient.request<TrendResponse>(url, { method: 'GET', auth: true });
}

export function fetchProductAnalytics(
  period: AnalyticsPeriod = '30d',
  sortBy: 'outbound' | 'inbound' | 'stock_risk' = 'outbound',
  limit = 8,
  startDate?: string,
  endDate?: string
): Promise<ProductAnalyticsResponse> {
  let url = `/api/v1/inventory/analytics/products?period=${period}&sort_by=${sortBy}&limit=${limit}`;
  if (period === 'custom' && startDate && endDate) {
    url += `&start_date=${startDate}&end_date=${endDate}`;
  }
  return apiClient.request<ProductAnalyticsResponse>(url, { method: 'GET', auth: true });
}