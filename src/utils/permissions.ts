import type { AppRole } from '@/utils/roles';


export type Permission =
  | 'inventory.view'
  | 'inventory.import'
  | 'products.create'
  | 'products.setStatus'
  | 'movement.view'
  | 'movement.create'
  | 'sales.create'
  | 'tasks.view'
  | 'tasks.manage'
  | 'calendar.view'
  | 'analytics.view'
  | 'employees.view'
  | 'employees.manage'
  | 'suppliers.view'
  | 'suppliers.edit'
  | 'suppliers.setStatus'
  | 'clients.view'
  | 'clients.edit'
  | 'clients.setStatus'
  | 'reports.view'
  | 'accounts.manage';

const OPERATIONAL: AppRole[] = ['admin', 'manager', 'employee'];
const ADMIN_MANAGER: AppRole[] = ['admin', 'manager'];
const ADMIN_ONLY: AppRole[] = ['admin'];

const PERMISSIONS: Record<Permission, AppRole[]> = {

  'inventory.view': OPERATIONAL,
  'inventory.import': ADMIN_MANAGER,
  'products.create': ADMIN_MANAGER,
  'products.setStatus': ADMIN_ONLY,

  'movement.view': OPERATIONAL,
  'movement.create': ADMIN_MANAGER,
  'sales.create': OPERATIONAL,

  'tasks.view': OPERATIONAL,
  'tasks.manage': OPERATIONAL,
  'calendar.view': OPERATIONAL,
  'analytics.view': ADMIN_MANAGER,
  'employees.view': ADMIN_ONLY,
  'employees.manage': ADMIN_ONLY,
  'suppliers.view': ADMIN_MANAGER,
  'suppliers.edit': ADMIN_MANAGER,
  'suppliers.setStatus': ADMIN_ONLY,

  'clients.view': ADMIN_MANAGER,
  'clients.edit': ADMIN_MANAGER,
  'clients.setStatus': ADMIN_MANAGER,

  
  'reports.view': ADMIN_ONLY,

  'accounts.manage': ['superadmin'],
};

export const ROUTE_PERMISSION: Record<string, Permission> = {
  inventory: 'inventory.view',
  inventorymovement: 'movement.view',
  tasks: 'tasks.view',
  'tasks-calendar': 'calendar.view',
  analytics: 'analytics.view',
  employees: 'employees.view',
  suppliers: 'suppliers.view',
  clients: 'clients.view',
  reports: 'reports.view',
  superAdmin: 'accounts.manage',
};

export function can(role: string | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return PERMISSIONS[permission].includes(role as AppRole);
}

export function canAccessRoute(role: string | null | undefined, routeName: string): boolean {
  const permission = ROUTE_PERMISSION[routeName];
  if (!permission) return true; 
  return can(role, permission);
}
