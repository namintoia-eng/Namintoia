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
    await expect(provider.createSession('p1')).rejects.toThrow(/E2B_API_KEY/);
    expect(sandboxCreate).not.toHaveBeenCalled();
  });

  it('creates exactly one E2B sandbox for the whole session, not per command', async () => {
    commandsRun.mockResolvedValue({ exitCode: 0, stdout: 'hi', stderr: '' });
    const provider = new E2bSandboxProvider({ apiKey: 'test-key' });

    const session = await provider.createSession('p1');
    await session.execute({ command: 'echo', args: ['one'] });
    await session.execute({ command: 'echo', args: ['two'] });

    expect(sandboxCreate).toHaveBeenCalledTimes(1);
    expect(commandsRun).toHaveBeenCalledTimes(2);
    expect(kill).not.toHaveBeenCalled();
  });

  it('streams output and reports the real exit code', async () => {
    commandsRun.mockResolvedValueOnce({ exitCode: 0, stdout: 'hi', stderr: '' });
    const provider = new E2bSandboxProvider({ apiKey: 'test-key' });
    const session = await provider.createSession('p1');

    const chunks: unknown[] = [];
    const result = await session.execute({ command: 'echo', args: ['hi'] }, (c) => chunks.push(c));

    expect(result).toEqual(expect.objectContaining({ exitCode: 0, timedOut: false }));
    expect(commandsRun).toHaveBeenCalledWith(
      "echo 'hi'",
      expect.objectContaining({ timeoutMs: 60_000 }),
    );
    expect(chunks).toContainEqual({ stream: 'status', data: 'started' });
    expect(chunks).toContainEqual({ stream: 'status', data: 'completed' });
  });

  it('shell-quotes args so a generated script with quotes/redirects survives intact', async () => {
    // Regression test: naively space-joining [command, ...args] corrupts
    // any script argument containing quotes or a redirect, because E2B's
    // commands.run() re-parses the joined string as a shell command line.
    // A script like this used to get silently truncated to just `echo`
    // with its redirect applied to the wrong (empty) output.
    commandsRun.mockResolvedValueOnce({ exitCode: 0, stdout: '', stderr: '' });
    const provider = new E2bSandboxProvider({ apiKey: 'test-key' });
    const session = await provider.createSession('p1');

    const script = "echo 'hello world' > /tmp/out.txt";
    await session.execute({ command: 'sh', args: ['-c', script] });

    const [calledWith] = commandsRun.mock.calls[0] as [string, unknown];
    // The joined command line, when re-parsed by a POSIX shell, must
    // reconstruct the exact original script as sh -c's single argument.
    // (Every arg is quoted, including plain ones like -c — a quoted flag
    // with no special characters is identical in meaning to an unquoted one.)
    expect(calledWith).toBe(`sh '-c' '${script.replace(/'/g, "'\\''")}'`);
  });

  it('reports a timeout instead of throwing when a command exceeds its limit', async () => {
    commandsRun.mockRejectedValueOnce(new Error('Command timeout after 60000ms'));
    const provider = new E2bSandboxProvider({ apiKey: 'test-key' });
    const session = await provider.createSession('p1');

    const result = await session.execute({ command: 'sleep', args: ['999'] });

    expect(result).toEqual(expect.objectContaining({ exitCode: null, timedOut: true }));
  });

  it('kills the underlying E2B sandbox when close() is called', async () => {
    const provider = new E2bSandboxProvider({ apiKey: 'test-key' });
    const session = await provider.createSession('p1');

    await session.close();

    expect(kill).toHaveBeenCalledTimes(1);
  });
});
