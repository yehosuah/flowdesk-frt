
import {
  afterEach,
  describe,
  expect,
  it,
} from 'vitest';

import { nextTick } from 'vue';

import { i18n } from '@/i18n';
import { useLocale } from '@/i18n/useLocale';

describe('Integración de idiomas - Sprint 10', () => {
  afterEach(() => {
    const { setLocale } = useLocale();
    setLocale('es');
    window.localStorage.removeItem('flowdesk.locale');
  });

  it('cambia de español a inglés mediante useLocale', async () => {
    const { locale, setLocale } = useLocale();

    setLocale('en');
    await nextTick();

    expect(locale.value).toBe('en');
    expect(i18n.global.locale.value).toBe('en');
    expect(i18n.global.t('navigation.inventory')).toBe('Inventory');
    expect(i18n.global.t('auth.login')).toBe('Log in');
  });

  it('regresa correctamente al español', async () => {
    const { locale, setLocale } = useLocale();

    setLocale('en');
    setLocale('es');
    await nextTick();

    expect(locale.value).toBe('es');
    expect(i18n.global.t('navigation.inventory')).toBe('Inventario');
  });

  it('guarda el idioma seleccionado', () => {
    const { setLocale } = useLocale();

    setLocale('en');

    expect(window.localStorage.getItem('flowdesk.locale')).toBe('en');
  });
});
