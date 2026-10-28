import { apiClient } from '@/services/apiClient';
import type {
  Task,
  TaskCreate,
  TaskPriority,
  TaskStatus,
  TaskStatusUpdate,
  TaskUpdate,
} from './types';

export async function fetchTasks(
  estado?: TaskStatus,
  prioridad?: TaskPriority,
  search?: string,
): Promise<Task[]> {
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
    body: data,
  });
}

export async function updateTask(id: string, data: TaskUpdate): Promise<Task> {
  return apiClient.request<Task>(`/api/v1/tasks/${id}`, {
    method: 'PUT',
    auth: true,
    body: data,
  });
}

export async function updateTaskStatus(id: string, estado: TaskStatus): Promise<Task> {
  const body: TaskStatusUpdate = { estado };

  return apiClient.request<Task>(`/api/v1/tasks/${id}/status`, {
    method: 'PATCH',
    auth: true,
    body,
  });
}

export async function deleteTask(id: string): Promise<void> {
  return apiClient.request<void>(`/api/v1/tasks/${id}`, {
    method: 'DELETE',
    auth: true,
  });
}
