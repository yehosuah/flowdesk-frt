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
    completeOnboarding(); // Mark as complete, can be reset from profile menu using resetOnboarding()

    const isMobile = window.innerWidth <= 1000;

    const tourConfig = {
      showProgress: true,
      progressText: 'Paso {{current}} de {{total}}',
      nextBtnText: 'Siguiente Paso',
      prevBtnText: 'Paso Anterior',
      doneBtnText: 'Finalizar',
      allowClose: true,
      showButtons: ['next', 'previous', 'close'],
      steps: [
        { 
          popover: { 
            title: '¡Bienvenido al Recorrido!', 
            description: 'Vamos a conocer las herramientas principales que harán crecer tu negocio.',
            side: 'left',
            align: 'start'
          }
        },
        { 
          element: isMobile ? '.header__hamburger' : '.sidebar',
          popover: { 
            title: 'Tu Panel de Navegación', 
            description: isMobile 
                ? 'Toca este botón para abrir el menú principal. Aquí encontrarás acceso al Inventario, Clientes, Reportes y configuración.'
                : 'Este es tu menú principal. Desde aquí accederás rápidamente al Inventario, Clientes, Reportes y configuración.', 
            side: isMobile ? 'bottom' : 'right', 
            align: 'start' 
          }
        },
        { 
          element: '.header-actions', 
          popover: { 
            title: 'Acciones Rápidas', 
            description: 'Aquí puedes buscar cualquier producto rápidamente, ver notificaciones importantes y acceder a tu perfil.', 
            side: 'bottom', 
            align: 'end' 
          }
        },
        { 
          element: '.chat-widget-btn',
          popover: {
            title: 'Asistente de Inteligencia Artificial',
            description: '¿Tienes dudas o necesitas ayuda? Nuestro Chatbot IA está disponible 24/7 para asistirte con el sistema.',
            side: 'left',
            align: 'start'
          }
        },
        { 
          element: '.main-layout__content', 
          popover: { 
            title: 'Tu Área de Trabajo', 
            description: 'Esta es la zona principal donde visualizarás tus tablas, gráficos y formularios interactivos. ¡Todo a un solo clic de distancia!', 
            side: 'top', 
            align: 'center' 
          }
        }
      ]
    };
    
    const driverObj = driver(tourConfig);

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
