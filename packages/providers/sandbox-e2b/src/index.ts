import type {
  SandboxExecutionRequest,
  SandboxExecutionResult,
  SandboxOutputChunk,
  SandboxProvider,
} from '@namintoia/naminto-core';
import { Sandbox } from 'e2b';

export interface E2bSandboxProviderConfig {
  apiKey?: string;
}

const DEFAULT_TIMEOUT_MS = 60_000;

/**
 * Default SandboxProvider adapter (DECISIONS.md D-3/D-8): managed microVM
 * isolation via E2B (Firecracker-based, matches STACK.md's target isolation
 * model). One E2B sandbox is created and destroyed per execution — no reuse
 * across requests, so a failed run can never leak state into the next one.
 */
export class E2bSandboxProvider implements SandboxProvider {
  readonly name = 'e2b';

  private readonly apiKey: string | undefined;

  constructor(config: E2bSandboxProviderConfig = {}) {
    this.apiKey = config.apiKey ?? process.env['E2B_API_KEY'];
  }

  async execute(
    request: SandboxExecutionRequest,
    onOutput?: (chunk: SandboxOutputChunk) => void,
  ): Promise<SandboxExecutionResult> {
    if (!this.apiKey) {
      throw new Error('E2bSandboxProvider: E2B_API_KEY is not configured (see .env.example).');
    }

    const startedAt = Date.now();
    const sandbox = await Sandbox.create({ apiKey: this.apiKey });
    onOutput?.({ stream: 'status', data: 'started' });

    try {
      const commandLine = [request.command, ...(request.args ?? [])].join(' ');
      const result = await sandbox.commands.run(commandLine, {
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
    } finally {
      await sandbox.kill();
    }
  }
}

function isTimeoutError(error: unknown): boolean {
  return error instanceof Error && /timeout/i.test(error.message);
}
