import type { IntelligenceProvider, SandboxProvider } from '@namintoia/naminto-core';
import { describe, expect, it } from 'vitest';
import { TestingAgent } from './index.js';

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

// Deep coverage of the shared shell-script-agent behavior lives in
// @namintoia/agent-kit's own tests; this file only checks TestingAgent's
// own identity and wiring.
describe('TestingAgent', () => {
  it('identifies as the testing role', () => {
    const agent = new TestingAgent(fakeIntelligenceProvider('npm test'), fakeSandboxProvider(0));
    expect(agent.role).toBe('testing');
  });

  it('reports failure when the test run exits non-zero', async () => {
    const agent = new TestingAgent(fakeIntelligenceProvider('npm test'), fakeSandboxProvider(1));
    const result = await agent.run({ agentRole: 'testing', instruction: 'test the hello function' });
    expect(result.success).toBe(false);
  });

  it('reports success when the test run exits 0', async () => {
    const agent = new TestingAgent(fakeIntelligenceProvider('npm test'), fakeSandboxProvider(0));
    const result = await agent.run({ agentRole: 'testing', instruction: 'test the hello function' });
    expect(result.success).toBe(true);
  });
});
