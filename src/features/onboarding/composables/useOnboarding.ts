import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import '../styles/onboarding.css';
import { getMessages, useLocale } from '@/i18n';

const ONBOARDING_KEY = 'flowdesk_has_seen_onboarding';

export interface UseOnboardingOptions {
  openSidebar?: () => void;
  closeSidebar?: () => void;
  navigateToInventory?: () => Promise<void> | void;
}

export function useOnboarding(options?: UseOnboardingOptions) {
  const isWelcomeVisible = ref(false);
  const { locale } = useLocale();
  let router: ReturnType<typeof useRouter> | null = null;
  try {
    router = useRouter();
  } catch {
    // En entornos donde vue-router no esté disponible
  }

  onMounted(() => {
    checkOnboardingStatus();
  });

  function checkOnboardingStatus() {
    const hasSeen = localStorage.getItem(ONBOARDING_KEY);
    if (!hasSeen) {
      isWelcomeVisible.value = true;
    }
  }

  function skipTour() {
    isWelcomeVisible.value = false;
    options?.closeSidebar?.();
    completeOnboarding();
  }

  function completeOnboarding() {
    localStorage.setItem(ONBOARDING_KEY, 'true');
  }

  function resetOnboarding() {
    localStorage.removeItem(ONBOARDING_KEY);
    isWelcomeVisible.value = true;
  }

  async function startTour() {
    isWelcomeVisible.value = false;
    // En móvil: cerrar el menú lateral para mostrar la pantalla y opciones principales
    options?.closeSidebar?.();
    completeOnboarding();

    // Redirigir a la vista de inventario para que el recorrido coincida con los elementos en pantalla
    if (options?.navigateToInventory) {
      await options.navigateToInventory();
    } else if (router && router.currentRoute.value.name !== 'inventory') {
      await router.push({ name: 'inventory' });
    }

    const isMobile = window.innerWidth <= 1000;
    const navSelector = isMobile ? '.mobile-menu-button' : '.sidebar';
    const headerSelector = isMobile ? '.mobile-header' : '.desktop-header';
    const restartSelector = isMobile ? '.mobile-menu-button' : '[data-tour="restart-tutorial"]';
    const copy = getMessages(locale.value).tutorial;

    const tourSteps = [
      {
        popover: {
          title: '¡Bienvenido a tu Espacio de Trabajo!',
          description: 'Vamos a guiarte sección por sección a través de las herramientas principales de FlowDesk para que conozcas la estructura de cada área.',
          side: 'bottom' as const,
          align: 'center' as const
        }
      },
      {
        element: navSelector,
        popover: {
          title: isMobile ? 'Sección 1: Menú Principal' : 'Sección 1: Panel Lateral de Módulos',
          description: isMobile
            ? 'Desde este botón despliegas tu menú de módulos cuando necesites cambiar de área: Inventario, Movimientos de almacén, Tareas del equipo, Calendario, Análisis y Clientes.'
            : 'Tu barra de navegación central: desde aquí accedes a Inventario, Movimientos con cálculo de impuestos, Tareas y flujos de trabajo, Calendario, Análisis con KPIs y Directorio de Clientes.',
          side: isMobile ? 'bottom' as const : 'right' as const,
          align: 'start' as const
        }
      },
      {
        element: headerSelector,
        popover: {
          title: 'Sección 2: Módulo Activo',
          description: 'En la parte superior siempre tendrás la referencia del módulo en el que estás posicionado y su propósito operativo (en este momento, tu vista de Inventario).',
          side: 'bottom' as const,
          align: isMobile ? 'center' as const : 'start' as const
        }
      },
      {
        element: '[data-nav-item="inventorymovement"]',
        popover: {
          title: 'Ventas y movimientos',
          description: 'Registra ventas, revisa movimientos y corrige existencias desde este módulo.',
          side: 'right' as const,
          align: 'start' as const
        }
      },
      {
        element: '[data-nav-item="tasks"]',
        popover: {
          title: 'Tareas del equipo',
          description: 'Organiza pendientes y da seguimiento al trabajo operativo del equipo.',
          side: 'right' as const,
          align: 'start' as const
        }
      },
      {
        element: '.filtros-panel',
        popover: {
          title: 'Sección 3: Panel de Filtros',
          description: 'Esta sección te permite personalizar las columnas que deseas ver (ID, precio, existencias) y filtrar por Estado (Activo/Inactivo) o condición de Stock (Normal, Bajo o Agotado).',
          side: isMobile ? 'bottom' as const : 'left' as const,
          align: 'start' as const
        }
      },
      {
        element: '.table-container',
        popover: {
          title: 'Sección 4: Catálogo y Existencias',
          description: 'Tu área de trabajo central: consulta tus productos registrados con existencias en tiempo real y alertas visuales automáticas para artículos con stock crítico.',
          side: isMobile ? 'top' as const : 'top' as const,
          align: 'center' as const
        }
      },
      {
        element: '.chat-widget-btn',
        popover: {
          title: 'Sección 5: Asistente IA 24/7',
          description: 'Siempre visible en la esquina inferior: un asistente con inteligencia artificial preparado para resolver dudas y ayudarte a operar en cualquier pantalla.',
          side: isMobile ? 'top' as const : 'left' as const,
          align: isMobile ? 'end' as const : 'end' as const
        }
      },
      {
        element: restartSelector,
        popover: {
          title: 'Sección 6: Repetir Tutorial',
          description: isMobile
            ? 'Si en cualquier momento deseas repasar estas secciones o capacitar a alguien de tu equipo, abre el menú y selecciona "Ver Tutorial" en la parte inferior.'
            : 'Siempre podrás reactivar este recorrido guiado pulsando la opción "Ver Tutorial" en la barra lateral.',
          side: isMobile ? 'bottom' as const : 'right' as const,
          align: 'start' as const
        }
      },
      {
        popover: {
          title: '¡Todo Listo para Comenzar!',
          description: 'Has completado el recorrido guiado por todas las secciones clave de FlowDesk. ¡Mucho éxito administrando tu negocio!',
          side: 'bottom' as const,
          align: 'center' as const
        }
      }
    ];

    const translatedSteps = tourSteps.map((step, index) => {
      const translated = [
        [copy.welcome, copy.welcomeDescription], [copy.menu, copy.menuDescription],
        [copy.active, copy.activeDescription], ['Ventas y movimientos', 'Registra ventas, revisa movimientos y corrige existencias desde este módulo.'],
        ['Tareas del equipo', 'Organiza pendientes y da seguimiento al trabajo operativo del equipo.'],
        [copy.filters, copy.filtersDescription], [copy.catalog, copy.catalogDescription],
        [copy.assistant, copy.assistantDescription], [copy.repeat, copy.repeatDescription],
        [copy.done, copy.doneDescription],
      ][index];
      return translated ? { ...step, popover: { ...step.popover, title: translated[0], description: translated[1] } } : step;
    });

    const driverObj = driver({
      showProgress: true,
      animate: true,
      smoothScroll: true,
      stagePadding: 8,
      stageRadius: 10,
      overlayColor: 'rgba(15, 23, 42, 0.58)',
      progressText: copy.progress,
      nextBtnText: copy.next,
      prevBtnText: copy.previous,
      doneBtnText: '¡Comenzar!',
      allowClose: true,
      allowKeyboardControl: true,
      skipMissingElement: true,
      showButtons: ['next', 'previous', 'close'],
      steps: translatedSteps,
      onDestroyed: () => {
        if (isMobile) {
          options?.closeSidebar?.();
        }
      }
    });

    setTimeout(() => {
      driverObj.drive();
    }, 350);
  }

  return {
    isWelcomeVisible,
    skipTour,
    startTour,
    resetOnboarding
  };
}
