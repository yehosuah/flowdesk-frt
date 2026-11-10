import { apiClient } from '@/services/apiClient';
import type { Sale } from '@/features/sales/types';

export interface Client {
  id: string;
  nombre: string;
  telefono: string | null;
  correo: string | null;
  direccion: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClientCreatePayload {
  nombre: string;
  telefono?: string | null;
  correo?: string | null;
  direccion?: string | null;
}

export interface ClientUpdatePayload {
  nombre?: string;
  telefono?: string | null;
  correo?: string | null;
  direccion?: string | null;
}

export function fetchClients(search?: string, active_only?: boolean): Promise<Client[]> {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (active_only !== undefined) params.append('active_only', String(active_only));

  const queryString = params.toString();
  const url = `/api/v1/commercial/clients${queryString ? `?${queryString}` : ''}`;

  return apiClient.request<Client[]>(url, {
    method: 'GET',
    auth: true,
  });
}


export function getClient(id: string): Promise<Client> {
  return apiClient.request<Client>(`/api/v1/commercial/clients/${id}`, {
    method: 'GET',
    auth: true,
  });
}

/** GET /commercial/clients/{id}/purchases — ventas asociadas al cliente, de la más reciente a la más antigua. */
export function fetchClientPurchases(id: string, limit = 50): Promise<Sale[]> {
  return apiClient.request<Sale[]>(`/api/v1/commercial/clients/${id}/purchases?limit=${limit}`, {
    method: 'GET',
    auth: true,
  });
}

export function createClient(payload: ClientCreatePayload): Promise<Client> {
  return apiClient.request<Client>('/api/v1/commercial/clients', {
    method: 'POST',
    auth: true,
    body: payload,
  });
}


export function updateClient(id: string, payload: ClientUpdatePayload): Promise<Client> {
  return apiClient.request<Client>(`/api/v1/commercial/clients/${id}`, {
    method: 'PUT',
    auth: true,
    body: payload,
  });
}

export function toggleClientStatus(id: string, is_active: boolean): Promise<Client> {
  return apiClient.request<Client>(`/api/v1/commercial/clients/${id}/status`, {
    method: 'PATCH',
    auth: true,
    body: { is_active },
  });
}


export function deleteClient(id: string): Promise<void> {
  return apiClient.request<void>(`/api/v1/commercial/clients/${id}`, {
    method: 'DELETE',
    auth: true,
  });
}
