import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { flushPromises, mount } from '@vue/test-utils';

import TaskCalendarView from '@/features/tasks/views/TaskCalendarView.vue';
import type { Task } from '@/features/tasks/types';

const mocks = vi.hoisted(() => ({
  fetchTasks: vi.fn(),
  updateTask: vi.fn(),
}));

vi.mock('@/features/tasks/api', () => ({
  fetchTasks: mocks.fetchTasks,
  createTask: vi.fn(),
  updateTask: mocks.updateTask,
  updateTaskStatus: vi.fn(),
  deleteTask: vi.fn(),
}));

const tasks: Task[] = [
  {
    id: '1',
    usuario_id: 'u1',
    titulo: 'Pagar proveedor',
    descripcion: null,
    fecha_limite: '2026-10-15T00:00:00',
    estado: 'pendiente',
    prioridad: 'urgente',
    created_at: '2026-10-01T00:00:00',
    updated_at: '2026-10-01T00:00:00',
  },
  {
    id: '2',
    usuario_id: 'u1',
    titulo: 'Tarea sin fecha',
    descripcion: null,
    fecha_limite: null,
    estado: 'pendiente',
    prioridad: 'media',
    created_at: '2026-10-01T00:00:00',
    updated_at: '2026-10-01T00:00:00',
  },
];

async function createWrapper() {
  const wrapper = mount(TaskCalendarView, {
    global: {
      stubs: { TaskEditModal: true },
    },
  });

  await flushPromises();

  return wrapper;
}

describe('SCRUM-713: Calendario con API real', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 1));

    mocks.fetchTasks.mockResolvedValue(
      tasks.map(task => ({ ...task })),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('carga las tareas desde la API y las ubica por fecha límite', async () => {
    const wrapper = await createWrapper();

    expect(mocks.fetchTasks).toHaveBeenCalledTimes(1);

    const chips = wrapper.findAll('.task-chip');

    expect(chips).toHaveLength(1);
    expect(chips[0].text()).toContain('Pagar proveedor');
    expect(chips[0].find('.task-dot').classes()).toContain('urgent');

    wrapper.unmount();
  });

  it('no ubica en el calendario las tareas sin fecha límite', async () => {
    const wrapper = await createWrapper();

    expect(wrapper.text()).not.toContain('Tarea sin fecha');

    wrapper.unmount();
  });

  it('muestra un error y permite reintentar la carga', async () => {
    mocks.fetchTasks.mockRejectedValueOnce(new Error('Sin conexión'));

    const wrapper = await createWrapper();

    expect(
      wrapper.find('[data-test="calendar-error"]').exists(),
    ).toBe(true);

    await wrapper.find('.btn-retry').trigger('click');
    await flushPromises();

    expect(mocks.fetchTasks).toHaveBeenCalledTimes(2);

    expect(
      wrapper.find('[data-test="calendar-error"]').exists(),
    ).toBe(false);

    expect(wrapper.findAll('.task-chip')).toHaveLength(1);

    wrapper.unmount();
  });
});
