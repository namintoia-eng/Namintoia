import type {
  IntelligenceProvider,
  SandboxExecutionRequest,
  SandboxExecutionResult,
  SandboxOutputChunk,
  SandboxProvider,
} from '@namintoia/naminto-core';
import { describe, expect, it } from 'vitest';
import { CodingAgent } from './index.js';

function fakeIntelligenceProvider(content: string): IntelligenceProvider {
  return {
    name: 'fake-intelligence',
    async generate() {
      return { content, usage: { inputTokens: 1, outputTokens: 1 }, stopReason: 'completed' };
    },
  };
}

function fakeSandboxProvider(
  result: SandboxExecutionResult,
  chunks: SandboxOutputChunk[] = [],
): SandboxProvider & { lastRequest?: SandboxExecutionRequest } {
  const provider: SandboxProvider & { lastRequest?: SandboxExecutionRequest } = {
    name: 'fake-sandbox',
    async execute(request, onOutput) {
      provider.lastRequest = request;
      for (const chunk of chunks) {
        onOutput?.(chunk);
      }
      return result;
    },
  };
  return provider;
}

describe('CodingAgent', () => {
  it('throws when the model returns an empty script', async () => {
    const agent = new CodingAgent(
      fakeIntelligenceProvider('   '),
      fakeSandboxProvider({ exitCode: 0, timedOut: false, durationMs: 1 }),
    );

    await expect(agent.run({ agentRole: 'coding', instruction: 'do nothing' })).rejects.toThrow(
      /empty script/,
    );
  });

  it('reports success and collected output when the sandbox exits 0', async () => {
    const sandbox = fakeSandboxProvider({ exitCode: 0, timedOut: false, durationMs: 5 }, [
      { stream: 'stdout', data: 'writing file...\n' },
      { stream: 'stdout', data: 'tests passed\n' },
    ]);
    const agent = new CodingAgent(fakeIntelligenceProvider('echo hi'), sandbox);

    const result = await agent.run({ agentRole: 'coding', instruction: 'add a hello function' });

    expect(result).toEqual({
      role: 'coding',
      success: true,
      output: 'writing file...\ntests passed\n',
    });
    expect(sandbox.lastRequest?.command).toBe('sh');
    expect(sandbox.lastRequest?.args).toEqual(['-c', 'echo hi']);
  });

  it('reports failure (not success) when the sandbox exits non-zero', async () => {
    const sandbox = fakeSandboxProvider({ exitCode: 1, timedOut: false, durationMs: 5 }, [
      { stream: 'stderr', data: 'SyntaxError: unexpected token\n' },
    ]);
    const agent = new CodingAgent(fakeIntelligenceProvider('exit 1'), sandbox);

    const result = await agent.run({ agentRole: 'coding', instruction: 'add a broken function' });

    expect(result.success).toBe(false);
    expect(result.output).toContain('SyntaxError');
    expect(result.output).toContain('exitCode=1');
  });

  it('reports failure when the sandbox times out, even without an exit code', async () => {
    const sandbox = fakeSandboxProvider({ exitCode: null, timedOut: true, durationMs: 120_000 });
    const agent = new CodingAgent(fakeIntelligenceProvider('sleep 999'), sandbox);

    const result = await agent.run({ agentRole: 'coding', instruction: 'do something slow' });

    expect(result.success).toBe(false);
    expect(result.output).toContain('timedOut=true');
  });

  it('never treats the model saying it is done as proof of success', async () => {
    // The model's script text claims success in prose-like echo, but the
    // sandbox still reports a non-zero exit — success must follow the
    // sandbox, not the script's own claims.
    const sandbox = fakeSandboxProvider({ exitCode: 2, timedOut: false, durationMs: 5 });
    const agent = new CodingAgent(
      fakeIntelligenceProvider('echo "Done! Everything works perfectly." && exit 2'),
      sandbox,
    );

    const result = await agent.run({ agentRole: 'coding', instruction: 'add a feature' });

    expect(result.success).toBe(false);
  });
});
