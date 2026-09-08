import { appStore } from '@/stores/app.store';
import { can as canPermission, canAccessRoute, type Permission } from '@/utils/permissions';


export function useAuth() {
  const role = appStore.roleName; 

  return {
    role,
    isAuthenticated: appStore.isAuthenticated,
    is: (target: string) => role.value === target,
    can: (permission: Permission) => canPermission(role.value, permission),
    canAccessRoute: (routeName: string) => canAccessRoute(role.value, routeName),
  };
}
