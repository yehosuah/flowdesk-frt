
<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router';
import { computed, ref, watch } from 'vue';

import {
  Menu,
  LogOut,
  HelpCircle,
  Package,
  ArrowRightLeft,
  ClipboardList,
  Calendar,
  Shield,
  BarChart3,
  Users,
  Truck,
  UserCircle,
  FileText,
  User,
  Receipt,
} from 'lucide-vue-next';

import { appStore } from '@/stores/app.store';
import { useAuth } from '@/composables/useAuth';

import ChatWidget from '@/features/chatbot/components/ChatWidget.vue';
import ChatPanel from '@/features/chatbot/components/ChatPanel.vue';
import WelcomeModal from '@/features/onboarding/components/WelcomeModal.vue';

import { useOnboarding } from '@/features/onboarding/composables/useOnboarding';
import NotificationBell from '@/features/notifications/components/NotificationBell.vue';
import { useInventoryAlerts } from '@/features/notifications/useInventoryAlerts';

const router = useRouter();

const sidebarOpen = ref(false);
const chatOpen = ref(false);

const { canAccessRoute } = useAuth();

// SCRUM-703: Redirigir al inicio de sesión cuando
// una sesión previamente autenticada deja de ser válida.
watch(
  () => appStore.isAuthenticated.value,
  async (authenticated, wasAuthenticated) => {
    if (
      wasAuthenticated &&
      !authenticated &&
      router.currentRoute.value.name !== 'login'
    ) {
      closeSidebar();
      closeChat();

      await router.replace({
        name: 'login',
      });
    }
  },
);

// Contador de notificaciones del menú móvil.
const { count: alertCount } = useInventoryAlerts();

const {
  isWelcomeVisible,
  skipTour,
  startTour,
  resetOnboarding,
} = useOnboarding({
  openSidebar: () => {
    sidebarOpen.value = true;
  },

  closeSidebar: () => {
    sidebarOpen.value = false;
  },

  navigateToInventory: async () => {
    if (router.currentRoute.value.name !== 'inventory') {
      await router.push({
        name: 'inventory',
      });
    }
  },
});

function toggleSidebar(): void {
  sidebarOpen.value = !sidebarOpen.value;
}

function closeSidebar(): void {
  sidebarOpen.value = false;
}

function openChat(): void {
  chatOpen.value = true;
}

function closeChat(): void {
  chatOpen.value = false;
}

// Controlar el desplazamiento de la página
// cuando el menú móvil se encuentra abierto.
watch(sidebarOpen, (isOpen) => {
  if (window.innerWidth <= 1000) {
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }
});

const navItems = [
  {
    name: 'inventory',
    label: 'Inventario',
    to: { name: 'inventory' },
    icon: Package,
  },
  {
    name: 'inventorymovement',
    label: 'Movimiento de Inventario',
    to: { name: 'inventorymovement' },
    icon: ArrowRightLeft,
  },
  {
    name: 'tasks',
    label: 'Gestión de tareas',
    to: { name: 'tasks' },
    icon: ClipboardList,
  },
  {
    name: 'tasks-calendar',
    label: 'Calendario',
    to: { name: 'tasks-calendar' },
    icon: Calendar,
  },
  {
    name: 'superAdmin',
    label: 'Manejo de Cuentas',
    to: { name: 'superAdmin' },
    icon: Shield,
  },
  {
    name: 'analytics',
    label: 'Análisis',
    to: { name: 'analytics' },
    icon: BarChart3,
  },
  {
    name: 'employees',
    label: 'Empleados',
    to: { name: 'employees' },
    icon: Users,
  },
  {
    name: 'suppliers',
    label: 'Proveedores',
    to: { name: 'suppliers' },
    icon: Truck,
  },
  {
    name: 'clients',
    label: 'Clientes',
    to: { name: 'clients' },
    icon: UserCircle,
  },
  {
    name: 'reports',
    label: 'Reportes',
    to: { name: 'reports' },
    icon: FileText,
  },
  {
    name: 'tax-dashboard',
    label: 'Dashboard Tributario',
    to: { name: 'tax-dashboard' },
    icon: Receipt,
  },
  {
    name: 'profile',
    label: 'Mi Perfil',
    to: { name: 'profile' },
    icon: User,
  },
];

// Mostrar únicamente las opciones permitidas
// para el rol del usuario autenticado.
const visibleNavItems = computed(() =>
  navItems.filter((item) =>
    canAccessRoute(item.name),
  ),
);

async function cerrarSesion(): Promise<void> {
  closeSidebar();
  closeChat();

  appStore.clearSession();

  if (router.currentRoute.value.name !== 'login') {
    await router.replace({
      name: 'login',
    });
  }
}
</script>
