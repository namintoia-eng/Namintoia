import { describe, expect, it } from 'vitest';
import { StubSandboxProvider } from './index.js';

describe('StubSandboxProvider', () => {
  it('refuses to create a session instead of silently running code on the host', async () => {
    const provider = new StubSandboxProvider();
    await expect(provider.createSession('p1')).rejects.toThrow(/no managed sandbox provider/);
  });
});
