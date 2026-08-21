import { describe, expect, it } from 'vitest';
import { StubSandboxProvider } from './index.js';

describe('StubSandboxProvider', () => {
  it('refuses to execute code instead of silently running it on the host', async () => {
    const provider = new StubSandboxProvider();
    await expect(provider.execute({ projectId: 'p1', command: 'echo hi' })).rejects.toThrow(
      /no managed sandbox provider/,
    );
  });
});
