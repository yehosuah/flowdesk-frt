
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import type { Locale } from '@/i18n/types';

const STORAGE_KEY = 'flowdesk.locale';

async function loadLocaleModules() {
  // Reiniciar los módulos para simular
  // un nuevo inicio de la aplicación.
  vi.resetModules();

  // Importar ambas funciones desde el mismo
  // conjunto de módulos para compartir i18n.
  const { i18n } = await import('@/i18n');
  const { hydrateLocale, useLocale } =
    await import('@/i18n/useLocale');

  return {
    i18n,
    hydrateLocale,
    useLocale,
  };
}

describe('SCRUM-768: Persistencia de idioma', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('recupera inglés desde localStorage al inicializar', async () => {
    localStorage.setItem(STORAGE_KEY, 'en');

    const { i18n, hydrateLocale } =
      await loadLocaleModules();

    hydrateLocale();

    expect(i18n.global.locale.value).toBe('en');
  });

  it('mantiene español cuando no existe idioma guardado', async () => {
    const { i18n, hydrateLocale } =
      await loadLocaleModules();

    hydrateLocale();

    expect(i18n.global.locale.value).toBe('es');
  });

  it('ignora valores de idioma no admitidos', async () => {
    localStorage.setItem(STORAGE_KEY, 'fr');

    const { i18n, hydrateLocale } =
      await loadLocaleModules();

    hydrateLocale();

    expect(i18n.global.locale.value).toBe('es');
  });

  it('guarda el idioma seleccionado', async () => {
    const { i18n, useLocale } =
      await loadLocaleModules();

    const { setLocale } = useLocale();

    setLocale('en');

    expect(localStorage.getItem(STORAGE_KEY)).toBe('en');
    expect(i18n.global.locale.value).toBe('en');
  });

  it('permite cambiar de inglés a español', async () => {
    const { i18n, useLocale } =
      await loadLocaleModules();

    const { locale, setLocale } = useLocale();

    setLocale('en');

    expect(locale.value).toBe('en');
    expect(i18n.global.locale.value).toBe('en');

    setLocale('es');

    expect(locale.value).toBe('es');
    expect(i18n.global.locale.value).toBe('es');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('es');
  });

  it('rechaza idiomas no admitidos', async () => {
    const { i18n, useLocale } =
      await loadLocaleModules();

    const { setLocale } = useLocale();

    setLocale('fr' as Locale);

    expect(i18n.global.locale.value).toBe('es');
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('conserva el idioma después de simular una recarga', async () => {
    const firstLoad = await loadLocaleModules();

    firstLoad.useLocale().setLocale('en');

    expect(localStorage.getItem(STORAGE_KEY)).toBe('en');

    // Simular un nuevo inicio de FlowDesk.
    const secondLoad = await loadLocaleModules();

    secondLoad.hydrateLocale();

    expect(secondLoad.i18n.global.locale.value).toBe('en');
    expect(secondLoad.i18n.global.t('auth.login')).toBe('Log in');
  });

  it('recupera español después de una recarga', async () => {
    const firstLoad = await loadLocaleModules();

    firstLoad.useLocale().setLocale('en');
    firstLoad.useLocale().setLocale('es');

    const secondLoad = await loadLocaleModules();

    secondLoad.hydrateLocale();

    expect(secondLoad.i18n.global.locale.value).toBe('es');
    expect(secondLoad.i18n.global.t('auth.login')).toBe('Iniciar sesión');
  });
});
