import type {
  AgentRunContext,
  IntelligenceProvider,
  SandboxCommandRequest,
  SandboxExecutionResult,
  SandboxOutputChunk,
  SandboxSession,
} from '@namintoia/naminto-core';
import { describe, expect, it } from 'vitest';
import { ShellScriptAgent } from './shell-script-agent.js';

class TestAgent extends ShellScriptAgent {
  readonly role = 'coding' as const;
  protected readonly systemPrompt = 'test system prompt';
}

function fakeIntelligenceProvider(content: string): IntelligenceProvider {
  return {
    name: 'fake-intelligence',
    async generate() {
      return { content, usage: { inputTokens: 1, outputTokens: 1 }, stopReason: 'completed' };
    },
  };
}

function fakeContext(
  result: SandboxExecutionResult,
  chunks: SandboxOutputChunk[] = [],
): AgentRunContext & { session: SandboxSession & { lastRequest?: SandboxCommandRequest } } {
  const session: SandboxSession & { lastRequest?: SandboxCommandRequest } = {
    id: 'fake-session',
    async execute(request, onOutput) {
      session.lastRequest = request;
      for (const chunk of chunks) {
        onOutput?.(chunk);
      }
      return result;
    },
    async close() {},
  };
  return { sandboxSession: session, session };
}

describe('ShellScriptAgent', () => {
  it('throws when the model returns an empty script', async () => {
    const agent = new TestAgent(fakeIntelligenceProvider('   '));
    const context = fakeContext({ exitCode: 0, timedOut: false, durationMs: 1 });

    await expect(
      agent.run({ agentRole: 'coding', instruction: 'do nothing' }, context),
    ).rejects.toThrow(/empty script/);
  });

  it('reports success and collected output when the sandbox exits 0', async () => {
    const context = fakeContext({ exitCode: 0, timedOut: false, durationMs: 5 }, [
      { stream: 'stdout', data: 'writing file...\n' },
      { stream: 'stdout', data: 'tests passed\n' },
    ]);
    const agent = new TestAgent(fakeIntelligenceProvider('echo hi'));

    const result = await agent.run({ agentRole: 'coding', instruction: 'add a hello function' }, context);

    expect(result).toEqual({
      role: 'coding',
      success: true,
      output: 'writing file...\ntests passed\n',
    });
    expect(context.session.lastRequest?.command).toBe('sh');
    expect(context.session.lastRequest?.args).toEqual(['-c', 'echo hi']);
  });

  it('reports failure when the sandbox exits non-zero', async () => {
    const context = fakeContext({ exitCode: 1, timedOut: false, durationMs: 5 }, [
      { stream: 'stderr', data: 'SyntaxError: unexpected token\n' },
    ]);
    const agent = new TestAgent(fakeIntelligenceProvider('exit 1'));

    const result = await agent.run({ agentRole: 'coding', instruction: 'add a broken function' }, context);

    expect(result.success).toBe(false);
    expect(result.output).toContain('SyntaxError');
    expect(result.output).toContain('exitCode=1');
  });

  it('reports failure on timeout, even without an exit code', async () => {
    const context = fakeContext({ exitCode: null, timedOut: true, durationMs: 120_000 });
    const agent = new TestAgent(fakeIntelligenceProvider('sleep 999'));

    const result = await agent.run({ agentRole: 'coding', instruction: 'do something slow' }, context);

    expect(result.success).toBe(false);
    expect(result.output).toContain('timedOut=true');
  });

  it('never treats the model saying it is done as proof of success', async () => {
    const context = fakeContext({ exitCode: 2, timedOut: false, durationMs: 5 });
    const agent = new TestAgent(
      fakeIntelligenceProvider('echo "Done! Everything works perfectly." && exit 2'),
    );

    const result = await agent.run({ agentRole: 'coding', instruction: 'add a feature' }, context);

    expect(result.success).toBe(false);
  });

  it('never calls close() on the session — that is the orchestrator\'s job', async () => {
    const context = fakeContext({ exitCode: 0, timedOut: false, durationMs: 5 });
    let closed = false;
    context.session.close = async () => {
      closed = true;
    };
    const agent = new TestAgent(fakeIntelligenceProvider('echo hi'));

    await agent.run({ agentRole: 'coding', instruction: 'x' }, context);

    expect(closed).toBe(false);
  });
});
