import apiClient from '@/services/apiClient';
import type { Task, TaskCreate, TaskUpdate, TaskStatusUpdate } from './types';

export async function fetchTasks(estado?: string, prioridad?: string, search?: string): Promise<Task[]> {
  const params = new URLSearchParams();
  if (estado) params.append('estado', estado);
  if (prioridad) params.append('prioridad', prioridad);
  if (search) params.append('search', search);

  return apiClient.request<Task[]>(`/api/v1/tasks?${params.toString()}`, {
    method: 'GET',
    auth: true,
  });
}

export async function getTask(id: string): Promise<Task> {
  return apiClient.request<Task>(`/api/v1/tasks/${id}`, {
    method: 'GET',
    auth: true,
  });
}

export async function createTask(data: TaskCreate): Promise<Task> {
  return apiClient.request<Task>('/api/v1/tasks', {
    method: 'POST',
    auth: true,
    data,
  });
}

export async function updateTask(id: string, data: TaskUpdate): Promise<Task> {
  return apiClient.request<Task>(`/api/v1/tasks/${id}`, {
    method: 'PUT',
    auth: true,
    data,
  });
}

export async function updateTaskStatus(id: string, estado: string): Promise<Task> {
  return apiClient.request<Task>(`/api/v1/tasks/${id}/status`, {
    method: 'PATCH',
    auth: true,
    data: { estado },
  });
}

export async function deleteTask(id: string): Promise<void> {
  return apiClient.request<void>(`/api/v1/tasks/${id}`, {
    method: 'DELETE',
    auth: true,
  });
}
