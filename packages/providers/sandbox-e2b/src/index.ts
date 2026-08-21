import { randomUUID } from 'node:crypto';
import type {
  SandboxCommandRequest,
  SandboxExecutionResult,
  SandboxFileEntry,
  SandboxOutputChunk,
  SandboxProvider,
  SandboxSession,
} from '@namintoia/naminto-core';
import { Sandbox } from 'e2b';

export interface E2bSandboxProviderConfig {
  apiKey?: string;
}

const DEFAULT_TIMEOUT_MS = 60_000;

/**
 * Default SandboxProvider adapter (DECISIONS.md D-3/D-8/D-11): managed
 * microVM isolation via E2B (Firecracker-based, matches STACK.md's target
 * isolation model). One E2B sandbox is created per session and kept alive
 * for the whole session's lifetime — a Plan's tasks share it, so a testing
 * task sees the files a coding task just wrote — and must be explicitly
 * closed by the caller (see close()).
 */
export class E2bSandboxProvider implements SandboxProvider {
  readonly name = 'e2b';

  private readonly apiKey: string | undefined;

  constructor(config: E2bSandboxProviderConfig = {}) {
    this.apiKey = config.apiKey ?? process.env['E2B_API_KEY'];
  }

  async createSession(projectId: string): Promise<SandboxSession> {
    if (!this.apiKey) {
      throw new Error('E2bSandboxProvider: E2B_API_KEY is not configured (see .env.example).');
    }

    const sandbox = await Sandbox.create({ apiKey: this.apiKey });
    return new E2bSandboxSession(`${projectId}-${randomUUID()}`, sandbox);
  }
}

class E2bSandboxSession implements SandboxSession {
  constructor(
    readonly id: string,
    private readonly sandbox: Sandbox,
  ) {}

  async execute(
    request: SandboxCommandRequest,
    onOutput?: (chunk: SandboxOutputChunk) => void,
  ): Promise<SandboxExecutionResult> {
    const startedAt = Date.now();
    onOutput?.({ stream: 'status', data: 'started' });

    try {
      const commandLine = [request.command, ...(request.args ?? []).map(shellQuote)].join(' ');
      const result = await this.sandbox.commands.run(commandLine, {
        cwd: request.workingDirectory,
        envs: request.environment,
        timeoutMs: request.limits?.maxWallClockMs ?? DEFAULT_TIMEOUT_MS,
        onStdout: (data: string) => onOutput?.({ stream: 'stdout', data }),
        onStderr: (data: string) => onOutput?.({ stream: 'stderr', data }),
      });

      onOutput?.({ stream: 'status', data: 'completed' });

      return {
        exitCode: result.exitCode,
        timedOut: false,
        durationMs: Date.now() - startedAt,
      };
    } catch (error) {
      if (isTimeoutError(error)) {
        onOutput?.({ stream: 'status', data: 'timed_out' });
        return { exitCode: null, timedOut: true, durationMs: Date.now() - startedAt };
      }
      throw error;
    }
  }

  async listFiles(directory: string): Promise<SandboxFileEntry[]> {
    // The installed e2b SDK (2.x) rejects depth < 1 — the "recursive means
    // -1" behavior from older SDK docs doesn't apply here (found live: the
    // real call throws InvalidArgumentError). A large finite depth is the
    // practical equivalent of "recursive" for a generated project's file tree.
    const entries = await this.sandbox.files.list(directory, { depth: 100 });
    return entries
      .filter((entry) => entry.type === 'file' || entry.type === 'dir')
      .map((entry) => ({
        path: entry.path,
        type: entry.type === 'dir' ? 'directory' : 'file',
      }));
  }

  async readFile(path: string): Promise<string> {
    return this.sandbox.files.read(path);
  }

  async close(): Promise<void> {
    await this.sandbox.kill();
  }
}

function isTimeoutError(error: unknown): boolean {
  return error instanceof Error && /timeout/i.test(error.message);
}

/**
 * E2B's commands.run() takes one shell command *string*, so args have to be
 * re-joined into one — naively space-joining them corrupts any arg with
 * spaces/quotes/redirects (exactly what a generated `sh -c "<script>"` arg
 * looks like). Single-quote each arg, escaping embedded single quotes the
 * standard POSIX way ('\'') so the joined string re-parses to the original
 * argument list.
 */
function shellQuote(arg: string): string {
  return `'${arg.replace(/'/g, `'\\''`)}'`;
}
