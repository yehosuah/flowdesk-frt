
<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

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
const { t } = useI18n();

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


const navItems = computed(() => [
  {
    name: 'inventory',
    label: t('navigation.inventory'),
    to: { name: 'inventory' },
    icon: Package,
  },
  {
    name: 'inventorymovement',
    label: t('navigation.inventoryMovement'),
    to: { name: 'inventorymovement' },
    icon: ArrowRightLeft,
  },
  {
    name: 'tasks',
    label: t('navigation.tasks'),
    to: { name: 'tasks' },
    icon: ClipboardList,
  },
  {
    name: 'tasks-calendar',
    label: t('navigation.calendar'),
    to: { name: 'tasks-calendar' },
    icon: Calendar,
  },
  {
    name: 'superAdmin',
    label: t('navigation.accounts'),
    to: { name: 'superAdmin' },
    icon: Shield,
  },
  {
    name: 'analytics',
    label: t('navigation.analytics'),
    to: { name: 'analytics' },
    icon: BarChart3,
  },
  {
    name: 'employees',
    label: t('navigation.employees'),
    to: { name: 'employees' },
    icon: Users,
  },
  {
    name: 'suppliers',
    label: t('navigation.suppliers'),
    to: { name: 'suppliers' },
    icon: Truck,
  },
  {
    name: 'clients',
    label: t('navigation.clients'),
    to: { name: 'clients' },
    icon: UserCircle,
  },
  {
    name: 'reports',
    label: t('navigation.reports'),
    to: { name: 'reports' },
    icon: FileText,
  },
  {
    name: 'tax-dashboard',
    label: t('navigation.taxation'),
    to: { name: 'tax-dashboard' },
    icon: Receipt,
  },
  {
    name: 'profile',
    label: t('navigation.profile'),
    to: { name: 'profile' },
    icon: User,
  },
]);


// Mostrar únicamente las opciones permitidas
// para el rol del usuario autenticado.
const visibleNavItems = computed(() =>
  navItems.value.filter((item) =>
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
