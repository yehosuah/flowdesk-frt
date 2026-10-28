import {
  describe,
  expect,
  it,
} from 'vitest';

import { mount } from '@vue/test-utils';

import TaskTable from '@/features/tasks/components/TaskTable.vue';
import type { Task } from '@/features/tasks/types';

const baseTask: Task = {
  id: '1',
  usuario_id: 'u1',
  titulo: 'Revisar inventario',
  descripcion: null,
  fecha_limite: '2026-10-30T00:00:00',
  estado: 'en_progreso',
  prioridad: 'urgente',
  created_at: '2026-10-01T00:00:00',
  updated_at: '2026-10-01T00:00:00',
};

describe('TaskTable - datos del backend', () => {
  it('muestra etiquetas legibles para prioridad y estado', () => {
    const wrapper = mount(TaskTable, {
      props: { tasks: [baseTask] },
    });

    expect(wrapper.find('.badge').text()).toBe('Urgente');
    expect(wrapper.find('.badge').classes()).toContain('badge--urgent');

    const select = wrapper.find('select').element as HTMLSelectElement;
    expect(select.value).toBe('en_progreso');
    expect(select.selectedOptions[0].text.trim()).toBe('En progreso');

    expect(wrapper.text()).not.toContain('en_progreso');
  });

  it('formatea la fecha límite del backend sin fechas inválidas', () => {
    const wrapper = mount(TaskTable, {
      props: { tasks: [baseTask] },
    });

    expect(wrapper.find('td.col-date').text()).toBe('30 - Oct - 2026');
    expect(wrapper.text()).not.toContain('Invalid');
  });

  it('muestra "Sin fecha" cuando la tarea no tiene fecha límite', () => {
    const wrapper = mount(TaskTable, {
      props: { tasks: [{ ...baseTask, fecha_limite: null }] },
    });

    expect(wrapper.find('td.col-date').text()).toBe('Sin fecha');
  });

  it('emite el valor del backend al cambiar el estado', async () => {
    const wrapper = mount(TaskTable, {
      props: { tasks: [baseTask] },
    });

    await wrapper.find('select').setValue('completada');

    expect(wrapper.emitted('status-change')?.[0]).toEqual(['1', 'completada']);
  });
});

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

    expect(emptyCell.attributes('colspan')).toBe('5');
  });
});