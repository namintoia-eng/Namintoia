import { afterEach, describe, expect, it, vi } from 'vitest';

const commandsRun = vi.fn();
const kill = vi.fn();
const sandboxCreate = vi.fn(async () => ({
  commands: { run: commandsRun },
  kill,
}));

vi.mock('e2b', () => ({
  Sandbox: { create: sandboxCreate },
}));

const { E2bSandboxProvider } = await import('./index.js');

describe('E2bSandboxProvider', () => {
  afterEach(() => {
    commandsRun.mockReset();
    kill.mockReset();
    sandboxCreate.mockClear();
  });

  it('throws a clear configuration error when no API key is set', async () => {
    const provider = new E2bSandboxProvider({ apiKey: undefined });
    await expect(provider.execute({ projectId: 'p1', command: 'echo hi' })).rejects.toThrow(
      /E2B_API_KEY/,
    );
    expect(sandboxCreate).not.toHaveBeenCalled();
  });

  it('runs the command in a fresh sandbox, streams output, and always kills the sandbox', async () => {
    commandsRun.mockResolvedValueOnce({ exitCode: 0, stdout: 'hi', stderr: '' });
    const provider = new E2bSandboxProvider({ apiKey: 'test-key' });

    const chunks: unknown[] = [];
    const result = await provider.execute({ projectId: 'p1', command: 'echo', args: ['hi'] }, (c) =>
      chunks.push(c),
    );

    expect(result).toEqual(expect.objectContaining({ exitCode: 0, timedOut: false }));
    expect(commandsRun).toHaveBeenCalledWith(
      'echo hi',
      expect.objectContaining({ timeoutMs: 60_000 }),
    );
    expect(kill).toHaveBeenCalledTimes(1);
    expect(chunks).toContainEqual({ stream: 'status', data: 'started' });
    expect(chunks).toContainEqual({ stream: 'status', data: 'completed' });
  });

  it('reports a timeout instead of throwing when the command exceeds its limit', async () => {
    commandsRun.mockRejectedValueOnce(new Error('Command timeout after 60000ms'));
    const provider = new E2bSandboxProvider({ apiKey: 'test-key' });

    const result = await provider.execute({ projectId: 'p1', command: 'sleep', args: ['999'] });

    expect(result).toEqual(expect.objectContaining({ exitCode: null, timedOut: true }));
    expect(kill).toHaveBeenCalledTimes(1);
  });

  it('kills the sandbox even when the command fails for a non-timeout reason', async () => {
    commandsRun.mockRejectedValueOnce(new Error('boom'));
    const provider = new E2bSandboxProvider({ apiKey: 'test-key' });

    await expect(provider.execute({ projectId: 'p1', command: 'false' })).rejects.toThrow('boom');
    expect(kill).toHaveBeenCalledTimes(1);
  });
});
