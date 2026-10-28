
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import type {
  Task,
  TaskCreate,
  TaskUpdate,
} from '@/features/tasks/types';

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
}));

vi.mock('@/services/apiClient', () => ({
  apiClient: {
    request: mocks.request,
  },
}));

import {
  fetchTasks,
  getTask,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
} from '@/features/tasks/api';

const TASK_ID = '3f1c2a9e-7b1d-4c5e-9a0b-1d2e3f4a5b6c';

const task: Task = {
  id: TASK_ID,
  usuario_id: '9a8b7c6d-5e4f-4a3b-2c1d-0e9f8a7b6c5d',
  titulo: 'Revisar inventario',
  descripcion: 'Verificar existencias',
  fecha_limite: '2026-10-30T00:00:00',
  estado: 'pendiente',
  prioridad: 'alta',
  created_at: '2026-10-20T12:00:00',
  updated_at: '2026-10-20T12:00:00',
};

describe('SCRUM-809: Integración API de tareas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('consulta todas las tareas con autenticación', async () => {
    mocks.request.mockResolvedValue([task]);

    const result = await fetchTasks();

    expect(result).toEqual([task]);

    expect(mocks.request).toHaveBeenCalledWith(
      '/api/v1/tasks?',
      {
        method: 'GET',
        auth: true,
      },
    );
  });

  it('envía correctamente los filtros de búsqueda', async () => {
    mocks.request.mockResolvedValue([task]);

    await fetchTasks(
      'en_progreso',
      'urgente',
      'revisar inventario',
    );

    const [url, options] = mocks.request.mock.calls[0];

    const parsedUrl = new URL(
      url,
      'https://flowdesk.test',
    );

    expect(parsedUrl.pathname).toBe('/api/v1/tasks');

    expect(
      parsedUrl.searchParams.get('estado'),
    ).toBe('en_progreso');

    expect(
      parsedUrl.searchParams.get('prioridad'),
    ).toBe('urgente');

    expect(
      parsedUrl.searchParams.get('search'),
    ).toBe('revisar inventario');

    expect(options).toMatchObject({
      method: 'GET',
      auth: true,
    });
  });

  it('consulta una tarea por identificador', async () => {
    mocks.request.mockResolvedValue(task);

    const result = await getTask(TASK_ID);

    expect(result).toEqual(task);

    expect(mocks.request).toHaveBeenCalledWith(
      `/api/v1/tasks/${TASK_ID}`,
      {
        method: 'GET',
        auth: true,
      },
    );
  });

  it('crea una tarea mediante POST', async () => {
    const newTask: TaskCreate = {
      titulo: 'Revisar inventario',
      descripcion: 'Verificar existencias',
      prioridad: 'alta',
      fecha_limite: '2026-10-30T00:00:00',
    };

    mocks.request.mockResolvedValue(task);

    const result = await createTask(newTask);

    expect(result).toEqual(task);

    expect(mocks.request).toHaveBeenCalledWith(
      '/api/v1/tasks',
      {
        method: 'POST',
        auth: true,
        body: newTask,
      },
    );
  });

  it('actualiza una tarea mediante PUT', async () => {
    const changes: TaskUpdate = {
      titulo: 'Inventario actualizado',
      prioridad: 'media',
    };

    mocks.request.mockResolvedValue({
      ...task,
      ...changes,
    });

    const result = await updateTask(TASK_ID, changes);

    expect(result.titulo).toBe('Inventario actualizado');

    expect(mocks.request).toHaveBeenCalledWith(
      `/api/v1/tasks/${TASK_ID}`,
      {
        method: 'PUT',
        auth: true,
        body: changes,
      },
    );
  });

  it('actualiza el estado mediante PATCH', async () => {
    mocks.request.mockResolvedValue({
      ...task,
      estado: 'completada',
    });

    const result = await updateTaskStatus(
      TASK_ID,
      'completada',
    );

    expect(result.estado).toBe('completada');

    expect(mocks.request).toHaveBeenCalledWith(
      `/api/v1/tasks/${TASK_ID}/status`,
      {
        method: 'PATCH',
        auth: true,
        body: {
          estado: 'completada',
        },
      },
    );
  });

  it('elimina una tarea mediante DELETE', async () => {
    mocks.request.mockResolvedValue(undefined);

    await deleteTask(TASK_ID);

    expect(mocks.request).toHaveBeenCalledWith(
      `/api/v1/tasks/${TASK_ID}`,
      {
        method: 'DELETE',
        auth: true,
      },
    );
  });

  it('propaga los errores del backend al consultar tareas', async () => {
    mocks.request.mockRejectedValue(
      new Error('Error de conexión'),
    );

    await expect(fetchTasks()).rejects.toThrow(
      'Error de conexión',
    );
  });

  it('propaga errores al crear una tarea', async () => {
    mocks.request.mockRejectedValue(
      new Error('No se pudo crear la tarea'),
    );

    await expect(
      createTask({
        titulo: 'Nueva tarea',
        descripcion: 'Descripción',
        prioridad: 'media',
        fecha_limite: '2026-10-30T00:00:00',
      }),
    ).rejects.toThrow('No se pudo crear la tarea');
  });

  it('no envía filtros vacíos en la consulta', async () => {
    mocks.request.mockResolvedValue([]);

    await fetchTasks(undefined, undefined, '');

    const [url] = mocks.request.mock.calls[0];

    expect(url).toBe('/api/v1/tasks?');
  });
});
