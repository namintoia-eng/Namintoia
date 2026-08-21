import type { IntelligenceProvider, SandboxProvider } from '@namintoia/naminto-core';
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

function fakeSandboxProvider(exitCode: number | null): SandboxProvider {
  return {
    name: 'fake-sandbox',
    async execute() {
      return { exitCode, timedOut: false, durationMs: 5 };
    },
  };
}

// Deep coverage of the shared shell-script-agent behavior lives in
// @namintoia/agent-kit's own tests; this file only checks DebugAgent's own
// identity and wiring.
describe('DebugAgent', () => {
  it('identifies as the debug role', () => {
    const agent = new DebugAgent(fakeIntelligenceProvider('fix.sh'), fakeSandboxProvider(0));
    expect(agent.role).toBe('debug');
  });

  it('reports success once the fix script exits 0', async () => {
    const agent = new DebugAgent(fakeIntelligenceProvider('patch && npm test'), fakeSandboxProvider(0));
    const result = await agent.run({
      agentRole: 'debug',
      instruction: 'original task failed with SyntaxError, fix it',
    });
    expect(result.success).toBe(true);
  });

  it('reports failure when the fix does not resolve the root cause', async () => {
    const agent = new DebugAgent(fakeIntelligenceProvider('exit 1'), fakeSandboxProvider(1));
    const result = await agent.run({ agentRole: 'debug', instruction: 'try to fix it' });
    expect(result.success).toBe(false);
  });
});
