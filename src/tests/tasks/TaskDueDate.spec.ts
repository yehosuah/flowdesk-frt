import { describe, expect, it } from 'vitest';

import {
  parseFechaLimite,
  toDateKey,
  toFechaLimite,
} from '@/features/tasks/utils/dueDate';

describe('Fecha límite de tareas', () => {
  it('extrae el día del datetime que devuelve el backend', () => {
    expect(toDateKey('2026-10-30T00:00:00')).toBe('2026-10-30');
  });

  it('devuelve vacío cuando la tarea no tiene fecha', () => {
    expect(toDateKey(null)).toBe('');
  });

  it('convierte el día seleccionado al formato del backend', () => {
    expect(toFechaLimite('2026-10-30')).toBe('2026-10-30T00:00:00');
  });

  it('envía null cuando no se selecciona fecha', () => {
    expect(toFechaLimite('')).toBeNull();
  });

  it('interpreta la fecha en hora local sin desfase de día', () => {
    const date = parseFechaLimite('2026-10-30T00:00:00');

    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(9);
    expect(date?.getDate()).toBe(30);
  });

  it('no genera una fecha inválida para tareas sin fecha', () => {
    expect(parseFechaLimite(null)).toBeNull();
  });
});
