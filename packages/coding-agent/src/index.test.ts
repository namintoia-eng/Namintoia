import type { IntelligenceProvider, SandboxProvider } from '@namintoia/naminto-core';
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

function fakeSandboxProvider(exitCode: number | null, timedOut = false): SandboxProvider {
  return {
    name: 'fake-sandbox',
    async execute() {
      return { exitCode, timedOut, durationMs: 5 };
    },
  };
}

// Deep coverage of the shared shell-script-agent behavior (empty script
// guard, timeout mapping, "model claims success but exits non-zero") lives
// in @namintoia/agent-kit's own tests. This file only checks CodingAgent's
// own identity and wiring.
describe('CodingAgent', () => {
  it('identifies as the coding role', () => {
    const agent = new CodingAgent(fakeIntelligenceProvider('echo hi'), fakeSandboxProvider(0));
    expect(agent.role).toBe('coding');
  });

  it('reports success when the generated script exits 0', async () => {
    const agent = new CodingAgent(fakeIntelligenceProvider('echo hi'), fakeSandboxProvider(0));
    const result = await agent.run({ agentRole: 'coding', instruction: 'add a hello function' });
    expect(result).toEqual({ role: 'coding', success: true, output: '' });
  });

  it('reports failure when the generated script exits non-zero', async () => {
    const agent = new CodingAgent(fakeIntelligenceProvider('exit 1'), fakeSandboxProvider(1));
    const result = await agent.run({ agentRole: 'coding', instruction: 'add a broken function' });
    expect(result.success).toBe(false);
  });
});
