import type {
  SandboxExecutionRequest,
  SandboxExecutionResult,
  SandboxOutputChunk,
  SandboxProvider,
} from '@namintoia/naminto-core';

/**
 * Placeholder SandboxProvider: conforms to the interface but refuses to run
 * anything, because no real isolation (managed microVM provider, DECISIONS.md
 * D-3) is wired up yet. Never falls back to running code on the host process —
 * that would violate the "never run user code outside the sandbox" rule
 * (naminto-ops/RULES.md).
 */
export class StubSandboxProvider implements SandboxProvider {
  readonly name = 'stub';

  async execute(
    _request: SandboxExecutionRequest,
    _onOutput?: (chunk: SandboxOutputChunk) => void,
  ): Promise<SandboxExecutionResult> {
    throw new Error(
      'StubSandboxProvider: no managed sandbox provider is configured yet (DECISIONS.md D-3). ' +
        'Refusing to execute code outside a real sandbox.',
    );
  }
}
