import { computed, ref } from 'vue';
import type { Locale } from './types';

const STORAGE_KEY = 'flowdesk.locale';
const locale = ref<Locale>('es');
let hydrated = false;

function hydrate() {
  if (hydrated || typeof window === 'undefined') return;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'es' || stored === 'en') locale.value = stored;
  hydrated = true;
}

export function useLocale() {
  hydrate();
  const setLocale = (value: Locale) => {
    locale.value = value;
    hydrated = true;
    if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, value);
  };
  return { locale: computed(() => locale.value), setLocale };
}
