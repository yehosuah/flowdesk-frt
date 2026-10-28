import { apiClient } from '@/services/apiClient';

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  role_id: number;
  role_name: string;
  company_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CreateEmployeePayload {
  username: string;
  email: string;
  role_id: number;
}

export function fetchEmployees(): Promise<UserResponse[]> {
  return apiClient.request<UserResponse[]>('/api/v1/users', {
    method: 'GET',
    auth: true,
  });
}

export function createEmployee(payload: CreateEmployeePayload): Promise<UserResponse> {
  return apiClient.request<UserResponse>('/api/v1/auth/employees', {
    method: 'POST',
    auth: true,
    body: payload,
  });
}

export function fetchRoles(): Promise<{ id: number; name: string; description: string | null }[]> {
  return apiClient.request('/api/v1/roles', {
    method: 'GET',
    auth: true,
  });
}

export interface UpdateEmployeePayload {
  username?: string;
  role_id?: number;
  is_active?: boolean;
}

// El backend aplica todos los campos en una sola transacción: si uno es
// rechazado, no se guarda ninguno.
export function updateEmployee(userId: string, payload: UpdateEmployeePayload): Promise<UserResponse> {
  return apiClient.request<UserResponse>(`/api/v1/users/${userId}`, {
    method: 'PUT',
    auth: true,
    body: payload,
  });
}

export interface UpdateEmployeeStatusPayload {
  is_active: boolean;
}

export function updateEmployeeStatus(userId: string, payload: UpdateEmployeeStatusPayload): Promise<UserResponse> {
  return apiClient.request<UserResponse>(`/api/v1/users/${userId}/status`, {
    method: 'PATCH',
    auth: true,
    body: payload,
  });
}
