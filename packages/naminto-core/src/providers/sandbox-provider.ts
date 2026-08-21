export interface SandboxExecutionLimits {
  maxCpuMillis?: number;
  maxMemoryMb?: number;
  maxWallClockMs?: number;
  networkAccess?: 'none' | 'restricted' | 'full';
}

export interface SandboxCommandRequest {
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

export interface SandboxFileEntry {
  path: string;
  type: 'file' | 'directory';
}

/**
 * A single isolated environment that stays alive across multiple commands,
 * so a Plan's tasks (coding, then testing, then a debug retry) all see the
 * same file tree instead of each starting from an empty sandbox. Must be
 * closed explicitly once the whole Plan finishes.
 */
export interface SandboxSession {
  readonly id: string;
  execute(
    request: SandboxCommandRequest,
    onOutput?: (chunk: SandboxOutputChunk) => void,
  ): Promise<SandboxExecutionResult>;
  listFiles(directory: string): Promise<SandboxFileEntry[]>;
  readFile(path: string): Promise<string>;
  close(): Promise<void>;
}

/**
 * Isolation boundary for any code Naminto executes on a user's behalf.
 * Default target: managed microVM/Firecracker-compatible provider (DECISIONS.md D-3).
 */
export interface SandboxProvider {
  readonly name: string;
  createSession(projectId: string): Promise<SandboxSession>;
}
