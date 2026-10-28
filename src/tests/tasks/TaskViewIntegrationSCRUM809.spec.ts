
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { flushPromises, mount } from '@vue/test-utils';
import { defineComponent, nextTick } from 'vue';

import TaskView from '@/features/tasks/views/TaskView.vue';
import type { Task, TaskCreate, TaskStatus, TaskUpdate } from '@/features/tasks/types';

// Datos originales para restaurar cada prueba.
const mocks = vi.hoisted(() => {
  const initialTasks = [
    {
      id: '1',
      usuario_id: 'u1',
      titulo: 'Actualizar inventario',
      descripcion: 'Revisar el stock de productos.',
      fecha_limite: '2026-08-01T00:00:00',
      estado: 'pendiente',
      prioridad: 'alta',
      created_at: '2026-07-01T00:00:00',
      updated_at: '2026-07-01T00:00:00',
    },
    {
      id: '2',
      usuario_id: 'u1',
      titulo: 'Contactar proveedor',
      descripcion: 'Solicitar cotización de productos.',
      fecha_limite: '2026-08-03T00:00:00',
      estado: 'en_progreso',
      prioridad: 'media',
      created_at: '2026-07-01T00:00:00',
      updated_at: '2026-07-01T00:00:00',
    },
    {
      id: '3',
      usuario_id: 'u1',
      titulo: 'Preparar reporte mensual',
      descripcion: null,
      fecha_limite: null,
      estado: 'completada',
      prioridad: 'baja',
      created_at: '2026-07-01T00:00:00',
      updated_at: '2026-07-01T00:00:00',
    },
  ] as Task[];

  return {
    initialTasks,
    fetchTasks: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    updateTaskStatus: vi.fn(),
    deleteTask: vi.fn(),
  };
});

// Simular la API real de tareas.
vi.mock('@/features/tasks/api', () => ({
  fetchTasks: mocks.fetchTasks,
  createTask: mocks.createTask,
  updateTask: mocks.updateTask,
  updateTaskStatus: mocks.updateTaskStatus,
  deleteTask: mocks.deleteTask,
}));

function findInitialTask(id: string) {
  return mocks.initialTasks.find(task => task.id === id) as Task;
}

// Simulación de la tabla de tareas.
const TaskTableStub = defineComponent({
  name: 'TaskTable',

  props: ['tasks'],

  emits: ['edit', 'delete', 'status-change'],

  template: `
    <div data-test="task-table">
      <div
        v-for="task in tasks"
        :key="task.id"
        class="task-item"
      >
        <span>{{ task.titulo }}</span>
        <span>{{ task.estado }}</span>

        <button
          class="edit-task"
          @click="$emit('edit', task)"
        >
          Editar
        </button>

        <button
          class="complete-task"
          @click="$emit('status-change', task.id, 'completada')"
        >
          Completar
        </button>

        <button
          class="delete-task"
          @click="$emit('delete', task)"
        >
          Eliminar
        </button>
      </div>
    </div>
  `,
});

// Simulación de filtros.
const TaskFiltersStub = defineComponent({
  name: 'TaskFilters',

  emits: ['change'],

  template: `
    <div>
      <button
        data-test="filter-pending"
        @click="$emit('change', {
          search: '',
          status: 'pendiente',
          priority: ''
        })"
      >
        Filtrar pendientes
      </button>

      <button
        data-test="filter-search"
        @click="$emit('change', {
          search: 'proveedor',
          status: '',
          priority: ''
        })"
      >
        Buscar proveedor
      </button>

      <button
        data-test="clear-filters"
        @click="$emit('change', {
          search: '',
          status: '',
          priority: ''
        })"
      >
        Limpiar filtros
      </button>
    </div>
  `,
});

// Simulación del modal de creación.
const TaskCreateModalStub = defineComponent({
  name: 'TaskCreateModal',

  emits: ['create', 'close'],

  template: `
    <div data-test="create-modal">
      <button
        data-test="confirm-create"
        @click="$emit('create', {
          titulo: 'Nueva tarea de prueba',
          descripcion: 'Descripción de prueba',
          prioridad: 'alta',
          fecha_limite: '2026-10-30T00:00:00'
        })"
      >
        Guardar tarea
      </button>

      <button
        data-test="cancel-create"
        @click="$emit('close')"
      >
        Cancelar
      </button>
    </div>
  `,
});

// Simulación del modal de edición.
const TaskEditModalStub = defineComponent({
  name: 'TaskEditModal',

  props: ['task'],

  emits: ['save', 'close'],

  template: `
    <div data-test="edit-modal">
      <button
        data-test="confirm-edit"
        @click="$emit('save', {
          titulo: 'Tarea editada correctamente'
        })"
      >
        Guardar cambios
      </button>

      <button
        data-test="cancel-edit"
        @click="$emit('close')"
      >
        Cancelar
      </button>
    </div>
  `,
});

// Simulación de tarjetas de resumen.
const TaskSummaryCardsStub = defineComponent({
  name: 'TaskSummaryCards',

  props: ['tasks'],

  template: `
    <div data-test="summary-cards">
      {{ tasks.length }}
    </div>
  `,
});

// Simulación del diálogo de confirmación.
const ConfirmDialogStub = defineComponent({
  name: 'ConfirmDialog',

  props: ['message', 'loading'],

  emits: ['confirm', 'cancel'],

  template: `
    <div data-test="confirm-dialog">
      <p>{{ message }}</p>

      <button
        data-test="confirm-delete"
        @click="$emit('confirm')"
      >
        Eliminar
      </button>

      <button
        data-test="cancel-delete"
        @click="$emit('cancel')"
      >
        Cancelar
      </button>
    </div>
  `,
});

const stubs = {
  TaskTable: TaskTableStub,
  TaskFilters: TaskFiltersStub,
  TaskCreateModal: TaskCreateModalStub,
  TaskEditModal: TaskEditModalStub,
  TaskSummaryCards: TaskSummaryCardsStub,
  ConfirmDialog: ConfirmDialogStub,
};

// Montar la vista con los componentes simulados y esperar la carga inicial.
async function createWrapper() {
  const wrapper = mount(TaskView, {
    global: { stubs },
  });

  await flushPromises();

  return wrapper;
}

describe('SCRUM-809: Integración de la vista de tareas', () => {

  beforeEach(() => {
    vi.clearAllMocks();

    // Cada prueba recibe copias independientes de los datos originales.
    mocks.fetchTasks.mockImplementation(async () =>
      mocks.initialTasks.map(task => ({ ...task })),
    );

    mocks.createTask.mockImplementation(async (data: TaskCreate) => ({
      id: '99',
      usuario_id: 'u1',
      descripcion: null,
      fecha_limite: null,
      prioridad: 'media',
      estado: 'pendiente',
      created_at: '2026-10-27T00:00:00',
      updated_at: '2026-10-27T00:00:00',
      ...data,
    }));

    mocks.updateTask.mockImplementation(async (id: string, changes: TaskUpdate) => ({
      ...findInitialTask(id),
      ...changes,
    }));

    mocks.updateTaskStatus.mockImplementation(async (id: string, status: TaskStatus) => ({
      ...findInitialTask(id),
      estado: status,
    }));

    mocks.deleteTask.mockResolvedValue(undefined);
  });

  it('carga las tareas desde la API al montar la vista', async () => {
    const wrapper = await createWrapper();

    expect(mocks.fetchTasks).toHaveBeenCalledTimes(1);

    wrapper.unmount();
  });

  it('muestra las tareas iniciales', async () => {
    const wrapper = await createWrapper();

    expect(
      wrapper.findAll('.task-item'),
    ).toHaveLength(3);

    expect(wrapper.text()).toContain(
      'Actualizar inventario',
    );

    expect(wrapper.text()).toContain(
      'Contactar proveedor',
    );

    wrapper.unmount();
  });

  it('muestra el estado de carga mientras se consultan las tareas', async () => {
    mocks.fetchTasks.mockReturnValue(new Promise(() => {}));

    const wrapper = mount(TaskView, {
      global: { stubs },
    });

    await nextTick();

    expect(
      wrapper.find('[data-test="tasks-loading"]').exists(),
    ).toBe(true);

    expect(
      wrapper.find('[data-test="task-table"]').exists(),
    ).toBe(false);

    wrapper.unmount();
  });

  it('muestra un error y permite reintentar la carga', async () => {
    mocks.fetchTasks.mockRejectedValueOnce(
      new Error('Sin conexión'),
    );

    const wrapper = await createWrapper();

    expect(
      wrapper.find('[data-test="tasks-error"]').exists(),
    ).toBe(true);

    expect(
      wrapper.find('[data-test="task-table"]').exists(),
    ).toBe(false);

    await wrapper.find('.btn-retry').trigger('click');
    await flushPromises();

    expect(mocks.fetchTasks).toHaveBeenCalledTimes(2);

    expect(
      wrapper.find('[data-test="tasks-error"]').exists(),
    ).toBe(false);

    expect(
      wrapper.findAll('.task-item'),
    ).toHaveLength(3);

    wrapper.unmount();
  });

  it('abre el modal de creación', async () => {
    const wrapper = await createWrapper();

    await wrapper.find('.btn-create').trigger('click');

    expect(
      wrapper.find('[data-test="create-modal"]').exists(),
    ).toBe(true);

    wrapper.unmount();
  });

  it('crea una tarea y actualiza la lista', async () => {
    const wrapper = await createWrapper();

    await wrapper.find('.btn-create').trigger('click');

    await wrapper
      .find('[data-test="confirm-create"]')
      .trigger('click');

    await flushPromises();

    expect(mocks.createTask).toHaveBeenCalledWith({
      titulo: 'Nueva tarea de prueba',
      descripcion: 'Descripción de prueba',
      prioridad: 'alta',
      fecha_limite: '2026-10-30T00:00:00',
    });

    expect(wrapper.text()).toContain(
      'Nueva tarea de prueba',
    );

    expect(
      wrapper.findAll('.task-item'),
    ).toHaveLength(4);

    expect(
      wrapper.find('[data-test="create-modal"]').exists(),
    ).toBe(false);

    wrapper.unmount();
  });

  it('mantiene abierto el modal si la creación falla', async () => {
    mocks.createTask.mockRejectedValueOnce(
      new Error('Error del servidor'),
    );

    const wrapper = await createWrapper();

    await wrapper.find('.btn-create').trigger('click');

    await wrapper
      .find('[data-test="confirm-create"]')
      .trigger('click');

    await flushPromises();

    expect(
      wrapper.find('[data-test="create-modal"]').exists(),
    ).toBe(true);

    expect(
      wrapper.findAll('.task-item'),
    ).toHaveLength(3);

    wrapper.unmount();
  });

  it('permite cancelar la creación de una tarea', async () => {
    const wrapper = await createWrapper();

    await wrapper.find('.btn-create').trigger('click');

    await wrapper
      .find('[data-test="cancel-create"]')
      .trigger('click');

    expect(
      wrapper.find('[data-test="create-modal"]').exists(),
    ).toBe(false);

    expect(mocks.createTask).not.toHaveBeenCalled();

    expect(
      wrapper.findAll('.task-item'),
    ).toHaveLength(3);

    wrapper.unmount();
  });

  it('abre el modal de edición con la tarea seleccionada', async () => {
    const wrapper = await createWrapper();

    await wrapper.find('.edit-task').trigger('click');

    expect(
      wrapper.find('[data-test="edit-modal"]').exists(),
    ).toBe(true);

    wrapper.unmount();
  });

  it('edita una tarea y actualiza su información', async () => {
    const wrapper = await createWrapper();

    await wrapper.find('.edit-task').trigger('click');

    await wrapper
      .find('[data-test="confirm-edit"]')
      .trigger('click');

    await flushPromises();

    expect(mocks.updateTask).toHaveBeenCalledWith('1', {
      titulo: 'Tarea editada correctamente',
    });

    expect(wrapper.text()).toContain(
      'Tarea editada correctamente',
    );

    expect(
      wrapper.find('[data-test="edit-modal"]').exists(),
    ).toBe(false);

    wrapper.unmount();
  });

  it('actualiza el estado de una tarea', async () => {
    const wrapper = await createWrapper();

    await wrapper
      .find('.complete-task')
      .trigger('click');

    await flushPromises();

    expect(mocks.updateTaskStatus).toHaveBeenCalledWith(
      '1',
      'completada',
    );

    const firstTask =
      wrapper.findAll('.task-item')[0];

    expect(firstTask.text()).toContain(
      'completada',
    );

    wrapper.unmount();
  });

  it('revierte el estado si el backend rechaza el cambio', async () => {
    mocks.updateTaskStatus.mockRejectedValueOnce(
      new Error('Error del servidor'),
    );

    const wrapper = await createWrapper();

    await wrapper
      .find('.complete-task')
      .trigger('click');

    await flushPromises();

    const firstTask =
      wrapper.findAll('.task-item')[0];

    expect(firstTask.text()).toContain(
      'pendiente',
    );

    wrapper.unmount();
  });

  it('elimina una tarea después de confirmar', async () => {
    const wrapper = await createWrapper();

    await wrapper
      .find('.delete-task')
      .trigger('click');

    expect(
      wrapper.find('[data-test="confirm-dialog"]').text(),
    ).toContain('Actualizar inventario');

    await wrapper
      .find('[data-test="confirm-delete"]')
      .trigger('click');

    await flushPromises();

    expect(mocks.deleteTask).toHaveBeenCalledWith('1');

    expect(
      wrapper.findAll('.task-item'),
    ).toHaveLength(2);

    expect(
      wrapper.find('[data-test="confirm-dialog"]').exists(),
    ).toBe(false);

    wrapper.unmount();
  });

  it('no elimina la tarea si se cancela la confirmación', async () => {
    const wrapper = await createWrapper();

    await wrapper
      .find('.delete-task')
      .trigger('click');

    await wrapper
      .find('[data-test="cancel-delete"]')
      .trigger('click');

    expect(mocks.deleteTask).not.toHaveBeenCalled();

    expect(
      wrapper.findAll('.task-item'),
    ).toHaveLength(3);

    wrapper.unmount();
  });

  it('filtra tareas pendientes', async () => {
    const wrapper = await createWrapper();

    await wrapper
      .find('[data-test="filter-pending"]')
      .trigger('click');

    await nextTick();

    expect(
      wrapper.findAll('.task-item'),
    ).toHaveLength(1);

    expect(wrapper.text()).toContain(
      'Actualizar inventario',
    );

    wrapper.unmount();
  });

  it('filtra tareas por búsqueda', async () => {
    const wrapper = await createWrapper();

    await wrapper
      .find('[data-test="filter-search"]')
      .trigger('click');

    await nextTick();

    expect(
      wrapper.findAll('.task-item'),
    ).toHaveLength(1);

    expect(wrapper.text()).toContain(
      'Contactar proveedor',
    );

    wrapper.unmount();
  });

  it('busca sin fallar cuando una tarea no tiene descripción', async () => {
    const wrapper = await createWrapper();

    // La tarea 3 tiene descripcion: null.
    await wrapper
      .find('[data-test="filter-search"]')
      .trigger('click');

    await nextTick();

    expect(
      wrapper.findAll('.task-item'),
    ).toHaveLength(1);

    wrapper.unmount();
  });

  it('restablece las tareas al limpiar los filtros', async () => {
    const wrapper = await createWrapper();

    await wrapper
      .find('[data-test="filter-pending"]')
      .trigger('click');

    await nextTick();

    expect(
      wrapper.findAll('.task-item'),
    ).toHaveLength(1);

    await wrapper
      .find('[data-test="clear-filters"]')
      .trigger('click');

    await nextTick();

    expect(
      wrapper.findAll('.task-item'),
    ).toHaveLength(3);

    wrapper.unmount();
  });
});
