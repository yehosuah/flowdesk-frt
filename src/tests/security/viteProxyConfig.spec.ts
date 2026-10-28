// @vitest-environment node

import { describe, expect, it, vi } from 'vitest';
import { loadConfigFromFile } from 'vite';

describe('Configuración del proxy de desarrollo', () => {
  it('no habilita el proxy si falta VITE_PROXY_TARGET', async () => {
    vi.stubEnv('VITE_PROXY_TARGET', '');

    try {
      const result = await loadConfigFromFile(
        { command: 'serve', mode: 'test' },
        'vite.config.ts',
      );

      expect(result).not.toBeNull();
      expect(result?.config.server?.proxy).toEqual({});
    } finally {
      vi.unstubAllEnvs();
    }
  });
});