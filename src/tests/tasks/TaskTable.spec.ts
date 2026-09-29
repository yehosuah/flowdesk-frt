import {
  describe,
  expect,
  it,
} from 'vitest';

import { mount } from '@vue/test-utils';

import TaskTable from '@/features/tasks/components/TaskTable.vue';

describe('TaskTable - estados vacíos', () => {
  it('muestra el estado vacío cuando no existen tareas', () => {
    const wrapper = mount(TaskTable, {
      props: {
        tasks: [],
      },
    });

    expect(wrapper.find('.empty-row').exists()).toBe(true);
    expect(wrapper.find('.empty-state').exists()).toBe(true);

    expect(wrapper.text()).toContain(
      'No hay tareas registradas.',
    );
  });

  it('mantiene visibles los encabezados cuando la tabla está vacía', () => {
    const wrapper = mount(TaskTable, {
      props: {
        tasks: [],
      },
    });

    const text = wrapper.text();

    expect(text).toContain('Tarea');
    expect(text).toContain('Responsable');
    expect(text).toContain('Prioridad');
    expect(text).toContain('Estado');
    expect(text).toContain('Acciones');
  });

  it('no renderiza filas de tareas cuando no existen datos', () => {
    const wrapper = mount(TaskTable, {
      props: {
        tasks: [],
      },
    });

    expect(
      wrapper.findAll('tbody tr:not(.empty-row)'),
    ).toHaveLength(0);

    expect(
      wrapper.findAll('.task-column'),
    ).toHaveLength(0);
  });

  it('el estado vacío ocupa todas las columnas de la tabla', () => {
    const wrapper = mount(TaskTable, {
      props: {
        tasks: [],
      },
    });

    const emptyCell = wrapper.find('.empty-state');

    expect(emptyCell.attributes('colspan')).toBe('6');
  });
});