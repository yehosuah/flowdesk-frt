
import { computed } from 'vue';
import { i18n } from './index';
import type { Locale } from './types';

const STORAGE_KEY = 'flowdesk.locale';
let hydrated = false;

function hydrate(): void {
  if (hydrated || typeof window === 'undefined') return;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (stored === 'es' || stored === 'en') {
      i18n.global.locale.value = stored;
    }
  } catch {
    // Mantener el idioma predeterminado.
  }

  hydrated = true;
}

export function useLocale() {
  hydrate();

  const locale = computed<Locale>(() =>
    i18n.global.locale.value as Locale,
  );

  function setLocale(value: Locale): void {
    if (value !== 'es' && value !== 'en') return;

    i18n.global.locale.value = value;
    hydrated = true;

    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEY, value);
      } catch {
        // El idioma sigue funcionando sin almacenamiento.
      }
    }
  }

  return { locale, setLocale };
}
