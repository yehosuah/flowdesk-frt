import { apiClient } from '@/services/apiClient';

// ==========================================
// Types & Interfaces
// ==========================================

export interface Supplier {
  id: string;
  nombre: string;
  telefono: string | null;
  correo: string | null;
  direccion: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupplierCreatePayload {
  nombre: string;
  telefono?: string | null;
  correo?: string | null;
  direccion?: string | null;
}

export interface SupplierUpdatePayload {
  nombre?: string;
  telefono?: string | null;
  correo?: string | null;
  direccion?: string | null;
}

// ==========================================
// API Functions
// ==========================================

/**
 * Obtener lista de proveedores (Opcional: buscar por nombre y filtrar por estado)
 */
export function fetchSuppliers(search?: string, is_active?: boolean): Promise<Supplier[]> {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (is_active !== undefined) params.append('is_active', String(is_active));

  const queryString = params.toString();
  const url = `/api/v1/inventory/suppliers${queryString ? `?${queryString}` : ''}`;

  return apiClient.request<Supplier[]>(url, {
    method: 'GET',
    auth: true,
  });
}

/**
 * Obtener un proveedor por ID
 */
export function getSupplier(id: string): Promise<Supplier> {
  return apiClient.request<Supplier>(`/api/v1/inventory/suppliers/${id}`, {
    method: 'GET',
    auth: true,
  });
}

/**
 * Crear un nuevo proveedor
 */
export function createSupplier(payload: SupplierCreatePayload): Promise<Supplier> {
  return apiClient.request<Supplier>('/api/v1/inventory/suppliers', {
    method: 'POST',
    auth: true,
    body: payload,
  });
}

/**
 * Actualizar los datos de un proveedor existente
 */
export function updateSupplier(id: string, payload: SupplierUpdatePayload): Promise<Supplier> {
  return apiClient.request<Supplier>(`/api/v1/inventory/suppliers/${id}`, {
    method: 'PUT',
    auth: true,
    body: payload,
  });
}

/**
 * Activar o desactivar un proveedor
 */
export function toggleSupplierStatus(id: string, is_active: boolean): Promise<Supplier> {
  return apiClient.request<Supplier>(`/api/v1/inventory/suppliers/${id}/status`, {
    method: 'PATCH',
    auth: true,
    body: { is_active },
  });
}

/**
 * Eliminar (Soft delete) un proveedor
 */
export function deleteSupplier(id: string): Promise<void> {
  return apiClient.request<void>(`/api/v1/inventory/suppliers/${id}`, {
    method: 'DELETE',
    auth: true,
  });
}

export interface SupplierProductResponse {
  supplier_id: string;
  supplier_name: string;
  product_id: string;
  product_sku: string;
  product_name: string;
  quotation: number;
}

export function fetchSupplierProducts(supplierId: string): Promise<SupplierProductResponse[]> {
  return apiClient.request<SupplierProductResponse[]>(
    `/api/v1/inventory/supplier-products?supplier_id=${supplierId}`,
    { method: 'GET', auth: true }
  );
}
