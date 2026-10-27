
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { mount } from '@vue/test-utils';
import { defineComponent, nextTick } from 'vue';

import TaskView from '@/features/tasks/views/TaskView.vue';

// Datos originales para restaurar cada prueba.
const mocks = vi.hoisted(() => {
  const initialTasks = [
    {
      id: 1,
      title: 'Actualizar inventario',
      description: 'Revisar el stock de productos.',
      assignee: 'María',
      priority: 'Alta',
      status: 'Pendiente',
      dueDate: '2026-08-01',
    },
    {
      id: 2,
      title: 'Contactar proveedor',
      description: 'Solicitar cotización de productos.',
      assignee: 'Juan',
      priority: 'Media',
      status: 'En progreso',
      dueDate: '2026-08-03',
    },
    {
      id: 3,
      title: 'Preparar reporte mensual',
      description: 'Generar reporte de ventas.',
      assignee: 'Andrea',
      priority: 'Baja',
      status: 'Completada',
      dueDate: '2026-07-30',
    },
  ];

  return {
    initialTasks,
    tasks: initialTasks.map(task => ({ ...task })),
  };
});

// Simular los datos utilizados por TaskView.
vi.mock('@/features/tasks/data/mockTasks', () => ({
  mockTasks: mocks.tasks,
}));

// Simulación de la tabla de tareas.
const TaskTableStub = defineComponent({
  name: 'TaskTable',

  props: ['tasks'],

  emits: ['edit', 'status-change'],

  template: `
    <div data-test="task-table">
      <div
        v-for="task in tasks"
        :key="task.id"
        class="task-item"
      >
        <span>{{ task.title }}</span>
        <span>{{ task.status }}</span>

        <button
          class="edit-task"
          @click="$emit('edit', task)"
        >
          Editar
        </button>

        <button
          class="complete-task"
          @click="$emit('status-change', task.id, 'Completada')"
        >
          Completar
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
          status: 'Pendiente',
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
          id: 99,
          title: 'Nueva tarea de prueba',
          description: 'Descripción de prueba',
          assignee: 'Empleado',
          priority: 'Alta',
          status: 'Pendiente',
          dueDate: '2026-10-30'
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
          ...task,
          title: 'Tarea editada correctamente'
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

// Montar la vista con los componentes simulados.
function createWrapper() {
  return mount(TaskView, {
    global: {
      stubs: {
        TaskTable: TaskTableStub,
        TaskFilters: TaskFiltersStub,
        TaskCreateModal: TaskCreateModalStub,
        TaskEditModal: TaskEditModalStub,
        TaskSummaryCards: TaskSummaryCardsStub,
      },
    },
  });
}

describe('SCRUM-809: Integración de la vista de tareas', () => {

  beforeEach(() => {
    vi.clearAllMocks();

    // Restaurar los datos originales antes de cada prueba.
    // Se mantiene la referencia del arreglo que utiliza
    // el mock, pero se crean objetos independientes.
    mocks.tasks.splice(
      0,
      mocks.tasks.length,
      ...mocks.initialTasks.map(task => ({
        ...task,
      })),
    );
  });

  it('muestra las tareas iniciales', () => {
    const wrapper = createWrapper();

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

  it('abre el modal de creación', async () => {
    const wrapper = createWrapper();

    await wrapper.find('.btn-create').trigger('click');

    expect(
      wrapper.find('[data-test="create-modal"]').exists(),
    ).toBe(true);

    wrapper.unmount();
  });

  it('crea una tarea y actualiza la lista', async () => {
    const wrapper = createWrapper();

    await wrapper.find('.btn-create').trigger('click');

    await wrapper
      .find('[data-test="confirm-create"]')
      .trigger('click');

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

  it('permite cancelar la creación de una tarea', async () => {
    const wrapper = createWrapper();

    await wrapper.find('.btn-create').trigger('click');

    await wrapper
      .find('[data-test="cancel-create"]')
      .trigger('click');

    expect(
      wrapper.find('[data-test="create-modal"]').exists(),
    ).toBe(false);

    expect(
      wrapper.findAll('.task-item'),
    ).toHaveLength(3);

    wrapper.unmount();
  });

  it('abre el modal de edición con la tarea seleccionada', async () => {
    const wrapper = createWrapper();

    await wrapper.find('.edit-task').trigger('click');

    expect(
      wrapper.find('[data-test="edit-modal"]').exists(),
    ).toBe(true);

    wrapper.unmount();
  });

  it('edita una tarea y actualiza su información', async () => {
    const wrapper = createWrapper();

    await wrapper.find('.edit-task').trigger('click');

    await wrapper
      .find('[data-test="confirm-edit"]')
      .trigger('click');

    expect(wrapper.text()).toContain(
      'Tarea editada correctamente',
    );

    expect(
      wrapper.find('[data-test="edit-modal"]').exists(),
    ).toBe(false);

    wrapper.unmount();
  });

  it('actualiza el estado de una tarea', async () => {
    const wrapper = createWrapper();

    await wrapper
      .find('.complete-task')
      .trigger('click');

    const firstTask =
      wrapper.findAll('.task-item')[0];

    expect(firstTask.text()).toContain(
      'Completada',
    );

    wrapper.unmount();
  });

  it('filtra tareas pendientes', async () => {
    const wrapper = createWrapper();

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
    const wrapper = createWrapper();

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

  it('restablece las tareas al limpiar los filtros', async () => {
    const wrapper = createWrapper();

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
