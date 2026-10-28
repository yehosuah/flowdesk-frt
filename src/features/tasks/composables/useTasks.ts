import { ref } from 'vue';
import { getApiErrorMessage } from '@/services/apiClient';
import { useToast } from '@/composables/useToast';
import {
  createTask,
  deleteTask,
  fetchTasks,
  updateTask,
  updateTaskStatus,
} from '../api';
import type { Task, TaskCreate, TaskStatus, TaskUpdate } from '../types';

/**
 * Estado y operaciones de tareas contra el backend. Cada vista que lo usa
 * carga las tareas al montarse, así lo guardado se recupera al recargar.
 * Las operaciones devuelven true/false para que la vista decida si cierra
 * el modal; los errores se notifican con toast.
 */
export function useTasks() {
  const toast = useToast();

  const tasks = ref<Task[]>([]);
  const isLoading = ref(false);
  const loadError = ref('');
  const isSaving = ref(false);
  const isDeleting = ref(false);

  async function loadTasks() {
    isLoading.value = true;
    loadError.value = '';

    try {
      tasks.value = await fetchTasks();
    } catch (err) {
      loadError.value = getApiErrorMessage(err);
    } finally {
      isLoading.value = false;
    }
  }

  async function addTask(data: TaskCreate): Promise<boolean> {
    isSaving.value = true;

    try {
      const created = await createTask(data);
      tasks.value.unshift(created);
      toast.success('Tarea creada correctamente.');
      return true;
    } catch (err) {
      toast.error(`No se pudo crear la tarea. ${getApiErrorMessage(err)}`);
      return false;
    } finally {
      isSaving.value = false;
    }
  }

  async function saveTask(id: string, data: TaskUpdate): Promise<boolean> {
    isSaving.value = true;

    try {
      replaceTask(await updateTask(id, data));
      toast.success('Tarea actualizada correctamente.');
      return true;
    } catch (err) {
      toast.error(`No se pudo actualizar la tarea. ${getApiErrorMessage(err)}`);
      return false;
    } finally {
      isSaving.value = false;
    }
  }

  async function changeStatus(id: string, status: TaskStatus) {
    const task = tasks.value.find(item => item.id === id);
    if (!task || task.estado === status) return;

    // Actualización optimista: el select ya muestra el nuevo estado;
    // si el backend falla se revierte al anterior.
    const previous = task.estado;
    task.estado = status;

    try {
      replaceTask(await updateTaskStatus(id, status));
    } catch (err) {
      task.estado = previous;
      toast.error(`No se pudo cambiar el estado. ${getApiErrorMessage(err)}`);
    }
  }

  async function removeTask(id: string): Promise<boolean> {
    isDeleting.value = true;

    try {
      await deleteTask(id);
      tasks.value = tasks.value.filter(task => task.id !== id);
      toast.success('Tarea eliminada correctamente.');
      return true;
    } catch (err) {
      toast.error(`No se pudo eliminar la tarea. ${getApiErrorMessage(err)}`);
      return false;
    } finally {
      isDeleting.value = false;
    }
  }

  function replaceTask(updated: Task) {
    const index = tasks.value.findIndex(task => task.id === updated.id);
    if (index !== -1) {
      tasks.value.splice(index, 1, updated);
    }
  }

  return {
    tasks,
    isLoading,
    loadError,
    isSaving,
    isDeleting,
    loadTasks,
    addTask,
    saveTask,
    changeStatus,
    removeTask,
  };
}
