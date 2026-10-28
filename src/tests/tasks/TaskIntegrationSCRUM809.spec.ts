
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

const task: Task = {
  id: 1,
  title: 'Revisar inventario',
  description: 'Verificar existencias',
  assignee: 'Empleado de prueba',
  priority: 'Alta',
  status: 'Pendiente',
  dueDate: '2026-10-30',
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
      'Pendiente',
      'Alta',
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
    ).toBe('Pendiente');

    expect(
      parsedUrl.searchParams.get('prioridad'),
    ).toBe('Alta');

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

    const result = await getTask('1');

    expect(result).toEqual(task);

    expect(mocks.request).toHaveBeenCalledWith(
      '/api/v1/tasks/1',
      {
        method: 'GET',
        auth: true,
      },
    );
  });

  it('crea una tarea mediante POST', async () => {
    const newTask: TaskCreate = {
      title: 'Revisar inventario',
      description: 'Verificar existencias',
      assignee: 'Empleado de prueba',
      priority: 'Alta',
      status: 'Pendiente',
      dueDate: '2026-10-30',
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
      title: 'Inventario actualizado',
      priority: 'Media',
    };

    mocks.request.mockResolvedValue({
      ...task,
      ...changes,
    });

    const result = await updateTask('1', changes);

    expect(result.title).toBe('Inventario actualizado');

    expect(mocks.request).toHaveBeenCalledWith(
      '/api/v1/tasks/1',
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
      status: 'Completada',
    });

    const result = await updateTaskStatus(
      '1',
      'Completada',
    );

    expect(result.status).toBe('Completada');

    expect(mocks.request).toHaveBeenCalledWith(
      '/api/v1/tasks/1/status',
      {
        method: 'PATCH',
        auth: true,
        body: {
          estado: 'Completada',
        },
      },
    );
  });

  it('elimina una tarea mediante DELETE', async () => {
    mocks.request.mockResolvedValue(undefined);

    await deleteTask('1');

    expect(mocks.request).toHaveBeenCalledWith(
      '/api/v1/tasks/1',
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
        title: 'Nueva tarea',
        description: 'Descripción',
        assignee: 'Empleado',
        priority: 'Media',
        status: 'Pendiente',
        dueDate: '2026-10-30',
      }),
    ).rejects.toThrow('No se pudo crear la tarea');
  });

  it('no envía filtros vacíos en la consulta', async () => {
    mocks.request.mockResolvedValue([]);

    await fetchTasks('', '', '');

    const [url] = mocks.request.mock.calls[0];

    expect(url).toBe('/api/v1/tasks?');
  });
});
