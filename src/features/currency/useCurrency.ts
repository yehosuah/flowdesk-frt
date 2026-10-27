import { computed, ref } from 'vue';
import { DEFAULT_CURRENCY, findCurrency } from './types';

const STORAGE_KEY = 'flowdesk.currency';
const selectedCode = ref(DEFAULT_CURRENCY.code);
let hydrated = false;

function hydrate(): void {
  if (hydrated || typeof window === 'undefined') return;
  selectedCode.value = findCurrency(window.localStorage.getItem(STORAGE_KEY)).code;
  hydrated = true;
}

export function setCurrency(code: string): void {
  const currency = findCurrency(code);
  selectedCode.value = currency.code;
  hydrated = true;
  if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, currency.code);
}

export function useCurrency() {
  hydrate();
  const currency = computed(() => findCurrency(selectedCode.value));
  const formatCurrency = (value: number | string | null | undefined): string => {
    const amount = Number(value ?? 0);
    return new Intl.NumberFormat(currency.value.locale, {
      style: 'currency', currency: currency.value.code, minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).format(Number.isFinite(amount) ? amount : 0);
  };
  return { currency, formatCurrency, setCurrency };
}
