import { ref, onMounted } from 'vue';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

const ONBOARDING_KEY = 'flowdesk_has_seen_onboarding';

export function useOnboarding() {
  const isWelcomeVisible = ref(false);

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
    completeOnboarding();
  }

  function completeOnboarding() {
    localStorage.setItem(ONBOARDING_KEY, 'true');
  }

  function resetOnboarding() {
    localStorage.removeItem(ONBOARDING_KEY);
    isWelcomeVisible.value = true;
  }

  function startTour() {
    isWelcomeVisible.value = false;
    completeOnboarding(); // Mark as complete since they started it

    const driverObj = driver({
      showProgress: true,
      nextBtnText: 'Siguiente',
      prevBtnText: 'Anterior',
      doneBtnText: 'Finalizar',
      steps: [
        { 
          popover: { 
            title: '¡Vamos a empezar!', 
            description: 'Te daré un recorrido rápido por tu panel principal.',
            side: 'left',
            align: 'start'
          }
        },
        { 
          element: '.sidebar__nav', 
          popover: { 
            title: 'Navegación', 
            description: 'Desde aquí puedes acceder a todas las secciones: Inventario, Clientes, Reportes y más.', 
            side: 'right', 
            align: 'start' 
          }
        },
        { 
          element: '.header-actions', 
          popover: { 
            title: 'Opciones Rápidas', 
            description: 'Busca productos, revisa notificaciones o accede a tu perfil.', 
            side: 'bottom', 
            align: 'end' 
          }
        },
        { 
          element: '.main-layout__content', 
          popover: { 
            title: 'Área de Trabajo', 
            description: 'Aquí verás toda la información detallada de la sección que elijas. ¡Explora a tu ritmo!', 
            side: 'top', 
            align: 'center' 
          }
        }
      ]
    });

    // Small delay to ensure modal is closed and DOM is ready
    setTimeout(() => {
      driverObj.drive();
    }, 300);
  }

  return {
    isWelcomeVisible,
    skipTour,
    startTour,
    resetOnboarding
  };
}
