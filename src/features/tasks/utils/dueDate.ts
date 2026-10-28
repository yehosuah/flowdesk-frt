/**
 * El backend guarda fecha_limite como datetime sin zona horaria
 * ("2026-10-30T00:00:00"), pero en la interfaz solo interesa el día.
 */

/** "2026-10-30T00:00:00" → "2026-10-30" (formato que usan los selectores de fecha). */
export function toDateKey(fechaLimite: string | null): string {
  return fechaLimite ? fechaLimite.slice(0, 10) : '';
}

/** "2026-10-30" → "2026-10-30T00:00:00"; vacío → null (tarea sin fecha). */
export function toFechaLimite(dateKey: string): string | null {
  return dateKey ? `${dateKey}T00:00:00` : null;
}

/** Fecha local del día límite, o null si la tarea no tiene fecha. */
export function parseFechaLimite(fechaLimite: string | null): Date | null {
  const dateKey = toDateKey(fechaLimite);
  return dateKey ? new Date(`${dateKey}T00:00:00`) : null;
}
