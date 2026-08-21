export interface SandboxExecutionLimits {
  maxCpuMillis?: number;
  maxMemoryMb?: number;
  maxWallClockMs?: number;
  networkAccess?: 'none' | 'restricted' | 'full';
}

export interface SandboxExecutionRequest {
  projectId: string;
  command: string;
  args?: string[];
  workingDirectory?: string;
  environment?: Record<string, string>;
  limits?: SandboxExecutionLimits;
}

export type SandboxOutputChunk =
  | { stream: 'stdout' | 'stderr'; data: string }
  | { stream: 'status'; data: 'started' | 'completed' | 'timed_out' | 'killed' };

export interface SandboxExecutionResult {
  exitCode: number | null;
  timedOut: boolean;
  durationMs: number;
}

/**
 * Isolation boundary for any code Naminto executes on a user's behalf.
 * Default target: managed microVM/Firecracker-compatible provider (DECISIONS.md D-3).
 */
export interface SandboxProvider {
  readonly name: string;
  execute(
    request: SandboxExecutionRequest,
    onOutput?: (chunk: SandboxOutputChunk) => void,
  ): Promise<SandboxExecutionResult>;
}
