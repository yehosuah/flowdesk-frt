export type TaskStatus = | 'Pendiente' | 'En progreso' | 'Completada';

export type TaskPriority = | 'Sin prioridad'| 'Alta' | 'Media' | 'Baja';

export interface Task {
  id: number;
  title: string;
  description: string;
  assignee: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
}
export type TaskCreate = Omit<Task, 'id'>;
export type TaskUpdate = Partial<TaskCreate>;
export interface TaskStatusUpdate {
  estado: string;
}
