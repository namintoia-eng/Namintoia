import type { AgentRunContext, IntelligenceProvider, SandboxSession } from '@namintoia/naminto-core';
import { describe, expect, it } from 'vitest';
import { DebugAgent } from './index.js';

function fakeIntelligenceProvider(content: string): IntelligenceProvider {
  return {
    name: 'fake-intelligence',
    async generate() {
      return { content, usage: { inputTokens: 1, outputTokens: 1 }, stopReason: 'completed' };
    },
  };
}

function fakeContext(exitCode: number | null): AgentRunContext {
  const session: SandboxSession = {
    id: 'fake-session',
    async execute() {
      return { exitCode, timedOut: false, durationMs: 5 };
    },
    async listFiles() {
      return [];
    },
    async readFile() {
      return '';
    },
    async close() {},
  };
  return { sandboxSession: session };
}

// Deep coverage of the shared shell-script-agent behavior lives in
// @namintoia/agent-kit's own tests; this file only checks DebugAgent's own
// identity and wiring.
describe('DebugAgent', () => {
  it('identifies as the debug role', () => {
    const agent = new DebugAgent(fakeIntelligenceProvider('fix.sh'));
    expect(agent.role).toBe('debug');
  });

  it('reports success once the fix script exits 0', async () => {
    const agent = new DebugAgent(fakeIntelligenceProvider('patch && npm test'));
    const result = await agent.run(
      { agentRole: 'debug', instruction: 'original task failed with SyntaxError, fix it' },
      fakeContext(0),
    );
    expect(result.success).toBe(true);
  });

  it('reports failure when the fix does not resolve the root cause', async () => {
    const agent = new DebugAgent(fakeIntelligenceProvider('exit 1'));
    const result = await agent.run({ agentRole: 'debug', instruction: 'try to fix it' }, fakeContext(1));
    expect(result.success).toBe(false);
  });
});
