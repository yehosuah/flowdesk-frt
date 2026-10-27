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
    // Preserve the application's established display contract: no thousands
    // grouping and a regular space after the symbol (for example, "Q 1000.00").
    const safeAmount = Number.isFinite(amount) ? amount : 0;
    return `${currency.value.symbol} ${safeAmount.toFixed(2)}`;
  };
  return { currency, formatCurrency, setCurrency };
}
