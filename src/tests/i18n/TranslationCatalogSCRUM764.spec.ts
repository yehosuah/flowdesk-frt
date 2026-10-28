
import {
  describe,
  expect,
  it,
} from 'vitest';

import es from '@/i18n/locales/es';
import en from '@/i18n/locales/en';
import { i18n } from '@/i18n';

type TranslationTree = {
  readonly [key: string]: string | TranslationTree;
};

function getTranslationKeys(
  catalog: TranslationTree,
  prefix = '',
): string[] {
  const keys: string[] = [];

  for (const [key, value] of Object.entries(catalog)) {
    const fullKey = prefix
      ? `${prefix}.${key}`
      : key;

    if (typeof value === 'string') {
      keys.push(fullKey);
    } else {
      keys.push(
        ...getTranslationKeys(value, fullKey),
      );
    }
  }

  return keys.sort();
}

function getTranslationValues(
  catalog: TranslationTree,
): string[] {
  const values: string[] = [];

  for (const value of Object.values(catalog)) {
    if (typeof value === 'string') {
      values.push(value);
    } else {
      values.push(
        ...getTranslationValues(value),
      );
    }
  }

  return values;
}

describe('SCRUM-764: Catálogos español e inglés', () => {
  it('contiene las mismas claves en ambos idiomas', () => {
    const spanishKeys = getTranslationKeys(es);
    const englishKeys = getTranslationKeys(en);

    expect(englishKeys).toEqual(spanishKeys);
  });

  it('no contiene traducciones vacías en español', () => {
    const values = getTranslationValues(es);

    expect(values.length).toBeGreaterThan(0);

    expect(
      values.every(value => value.trim().length > 0),
    ).toBe(true);
  });

  it('no contiene traducciones vacías en inglés', () => {
    const values = getTranslationValues(en);

    expect(values.length).toBeGreaterThan(0);

    expect(
      values.every(value => value.trim().length > 0),
    ).toBe(true);
  });

  it('tiene español como idioma predeterminado', () => {
    expect(i18n.global.locale.value).toBe('es');
  });

  it('utiliza español como idioma de respaldo', () => {
    expect(i18n.global.fallbackLocale.value).toBe('es');
  });

  it('traduce correctamente las claves principales', () => {
    expect(
      i18n.global.t('navigation.inventory'),
    ).toBe('Inventario');

    expect(
      i18n.global.t('auth.login'),
    ).toBe('Iniciar sesión');

    expect(
      i18n.global.t('common.save'),
    ).toBe('Guardar');
  });

  it('dispone de traducciones en inglés', () => {
    const english = i18n.global.messages.value.en;

    expect(english).toBeDefined();

    expect(en.navigation.inventory).toBe('Inventory');
    expect(en.auth.login).toBe('Log in');
    expect(en.common.save).toBe('Save');
  });
});
