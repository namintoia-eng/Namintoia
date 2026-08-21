import type { IntelligenceProvider } from '@namintoia/naminto-core';
import { describe, expect, it } from 'vitest';
import { IntelligenceReasoningEngine } from './index.js';

function fakeIntelligenceProvider(content: string): IntelligenceProvider {
  return {
    name: 'fake-intelligence',
    async generate() {
      return {
        content,
        usage: { inputTokens: 1, outputTokens: 1 },
        stopReason: 'completed',
      };
    },
  };
}

const VALID_RESPONSE = JSON.stringify({
  spec: {
    objective: 'Add a login form',
    requirements: {
      functional: ['User can submit email/password'],
      nonFunctional: ['Response under 200ms'],
      constraints: ['Must reuse existing auth module'],
    },
    architecture: {
      modulesInvolved: ['User System'],
      newInterfaces: [],
    },
    components: ['LoginForm.tsx'],
    interfaces: ['POST /auth/login'],
  },
  tasks: [
    { agentRole: 'coding', instruction: 'Implement LoginForm.tsx' },
    { agentRole: 'testing', instruction: 'Write tests for LoginForm.tsx' },
  ],
});

describe('IntelligenceReasoningEngine', () => {
  it('turns a well-formed model response into a Plan', async () => {
    const engine = new IntelligenceReasoningEngine(fakeIntelligenceProvider(VALID_RESPONSE));

    const plan = await engine.planFromIntent('Add a login form');

    expect(plan.intent).toBe('Add a login form');
    expect(plan.spec.objective).toBe('Add a login form');
    expect(plan.tasks).toHaveLength(2);
    expect(plan.tasks[0]).toEqual({ agentRole: 'coding', instruction: 'Implement LoginForm.tsx' });
  });

  it('rejects a response that is not valid JSON', async () => {
    const engine = new IntelligenceReasoningEngine(fakeIntelligenceProvider('not json at all'));

    await expect(engine.planFromIntent('Add a login form')).rejects.toThrow(/not valid JSON/);
  });

  it('rejects a response missing required spec fields', async () => {
    const engine = new IntelligenceReasoningEngine(
      fakeIntelligenceProvider(JSON.stringify({ spec: { objective: 'x' }, tasks: [] })),
    );

    await expect(engine.planFromIntent('Add a login form')).rejects.toThrow(/spec.requirements/);
  });

  it('rejects a task with an invalid agentRole', async () => {
    const engine = new IntelligenceReasoningEngine(
      fakeIntelligenceProvider(
        JSON.stringify({
          spec: {
            objective: 'x',
            requirements: { functional: [], nonFunctional: [], constraints: [] },
            architecture: { modulesInvolved: [], newInterfaces: [] },
            components: [],
            interfaces: [],
          },
          tasks: [{ agentRole: 'deploying', instruction: 'do something' }],
        }),
      ),
    );

    await expect(engine.planFromIntent('Add a login form')).rejects.toThrow(/agentRole/);
  });
});
