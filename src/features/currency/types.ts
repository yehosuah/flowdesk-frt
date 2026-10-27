export interface CurrencyOption {
  code: string;
  name: string;
  locale: string;
  symbol: string;
}

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: 'GTQ', name: 'Quetzal guatemalteco', locale: 'es-GT', symbol: 'Q' },
  { code: 'USD', name: 'Dólar estadounidense', locale: 'en-US', symbol: '$' },
  { code: 'EUR', name: 'Euro', locale: 'es-ES', symbol: '€' },
];

export const DEFAULT_CURRENCY = CURRENCY_OPTIONS[0];

export function findCurrency(code?: string | null): CurrencyOption {
  return CURRENCY_OPTIONS.find((currency) => currency.code === code) ?? DEFAULT_CURRENCY;
}
