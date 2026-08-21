import { describe, expect, it } from 'vitest';
import { SelfHostedBackendProvider } from './index.js';

describe('SelfHostedBackendProvider', () => {
  it('throws a clear configuration error when the target URLs are missing', async () => {
    const provider = new SelfHostedBackendProvider({});
    await expect(
      provider.provisionProjectBackend({ projectId: 'p1', displayName: 'Test' }),
    ).rejects.toThrow(/DATABASE_URL/);
  });

  it('returns the configured URLs when provided explicitly', async () => {
    const provider = new SelfHostedBackendProvider({
      databaseUrl: 'postgres://local',
      authServiceUrl: 'http://local-auth',
      storageServiceUrl: 'http://local-storage',
    });

    const result = await provider.provisionProjectBackend({ projectId: 'p1', displayName: 'Test' });

    expect(result).toEqual({
      databaseUrl: 'postgres://local',
      authServiceUrl: 'http://local-auth',
      storageServiceUrl: 'http://local-storage',
    });
  });
});
