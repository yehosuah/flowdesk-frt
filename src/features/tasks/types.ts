export type TaskStatus = 'pendiente' | 'en_progreso' | 'completada' | 'cancelada';

export type TaskPriority = 'baja' | 'media' | 'alta' | 'urgente';

export const TASK_STATUSES: TaskStatus[] = [
  'pendiente',
  'en_progreso',
  'completada',
  'cancelada',
];

export const TASK_PRIORITIES: TaskPriority[] = [
  'urgente',
  'alta',
  'media',
  'baja',
];

// Textos que se muestran al usuario para los valores del backend.
export const STATUS_LABELS: Record<TaskStatus, string> = {
  pendiente: 'Pendiente',
  en_progreso: 'En progreso',
  completada: 'Completada',
  cancelada: 'Cancelada',
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
  urgente: 'Urgente',
};

export interface Task {
  id: string;
  usuario_id: string;
  titulo: string;
  descripcion: string | null;
  fecha_limite: string | null;
  estado: TaskStatus;
  prioridad: TaskPriority;
  created_at: string;
  updated_at: string;
}

export interface TaskCreate {
  titulo: string;
  descripcion?: string | null;
  fecha_limite?: string | null;
  prioridad?: TaskPriority;
}

export type TaskUpdate = Partial<TaskCreate>;

export interface TaskStatusUpdate {
  estado: TaskStatus;
}
