import { describe, it, expect } from 'vitest';
import { getMessages } from '@/i18n';

describe('Onboarding Tour', () => {
  it('mantiene textos completos para español e inglés', () => {
    expect(getMessages('es').tutorial.next).toBe('Siguiente');
    expect(getMessages('en').tutorial.next).toBe('Next');
    expect(getMessages('en').tutorial.doneDescription.length).toBeGreaterThan(10);
  });
});
