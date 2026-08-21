import type { Agent, AgentTask, AgentTaskResult, Plan } from '@namintoia/naminto-core';
import { describe, expect, it } from 'vitest';
import { SequentialAgentOrchestrator } from './index.js';

function fakeAgent(role: AgentTaskResult['role'], succeed: boolean): Agent & { calls: AgentTask[] } {
  const calls: AgentTask[] = [];
  return {
    role,
    calls,
    async run(task: AgentTask): Promise<AgentTaskResult> {
      calls.push(task);
      return { role, success: succeed, output: succeed ? 'ok' : 'failed' };
    },
  };
}

function planWith(tasks: AgentTask[]): Plan {
  return {
    intent: 'test intent',
    spec: {
      objective: 'x',
      requirements: { functional: [], nonFunctional: [], constraints: [] },
      architecture: { modulesInvolved: [], newInterfaces: [] },
      components: [],
      interfaces: [],
    },
    tasks,
  };
}

describe('SequentialAgentOrchestrator', () => {
  it('runs tasks in order and reports success when every task succeeds', async () => {
    const coding = fakeAgent('coding', true);
    const testing = fakeAgent('testing', true);
    const orchestrator = new SequentialAgentOrchestrator(
      new Map([
        ['coding', coding],
        ['testing', testing],
      ]),
    );

    const plan = planWith([
      { agentRole: 'coding', instruction: 'write the code' },
      { agentRole: 'testing', instruction: 'write the tests' },
    ]);

    const result = await orchestrator.run(plan);

    expect(result.success).toBe(true);
    expect(result.results.map((r) => r.role)).toEqual(['coding', 'testing']);
    expect(coding.calls).toHaveLength(1);
    expect(testing.calls).toHaveLength(1);
  });

  it('stops at the first failed task instead of running the rest', async () => {
    const coding = fakeAgent('coding', false);
    const testing = fakeAgent('testing', true);
    const orchestrator = new SequentialAgentOrchestrator(
      new Map([
        ['coding', coding],
        ['testing', testing],
      ]),
    );

    const plan = planWith([
      { agentRole: 'coding', instruction: 'write the code' },
      { agentRole: 'testing', instruction: 'write the tests' },
    ]);

    const result = await orchestrator.run(plan);

    expect(result.success).toBe(false);
    expect(result.results).toHaveLength(1);
    expect(testing.calls).toHaveLength(0);
  });

  it('throws a clear error when a task needs an unregistered agent role', async () => {
    const orchestrator = new SequentialAgentOrchestrator(new Map());
    const plan = planWith([{ agentRole: 'debug', instruction: 'fix it' }]);

    await expect(orchestrator.run(plan)).rejects.toThrow(/no agent registered for role "debug"/);
  });

  it('hands a failed task to the debug agent and succeeds once the fix works', async () => {
    const coding = fakeAgent('coding', false);
    const debug = fakeAgentSucceedingOnAttempt('debug', 2);
    const orchestrator = new SequentialAgentOrchestrator(
      new Map([
        ['coding', coding],
        ['debug', debug],
      ]),
    );

    const plan = planWith([{ agentRole: 'coding', instruction: 'write the code' }]);
    const result = await orchestrator.run(plan);

    expect(result.success).toBe(true);
    expect(debug.calls).toHaveLength(2);
    // coding result + 2 debug attempts
    expect(result.results).toHaveLength(3);
  });

  it('stops after the bounded number of debug attempts and surfaces the failure', async () => {
    const coding = fakeAgent('coding', false);
    const debug = fakeAgent('debug', false);
    const orchestrator = new SequentialAgentOrchestrator(
      new Map([
        ['coding', coding],
        ['debug', debug],
      ]),
      { maxDebugAttempts: 3 },
    );

    const plan = planWith([{ agentRole: 'coding', instruction: 'write the code' }]);
    const result = await orchestrator.run(plan);

    expect(result.success).toBe(false);
    expect(debug.calls).toHaveLength(3);
    expect(result.results).toHaveLength(4); // coding result + 3 debug attempts
  });

  it('never invokes the debug agent when every task already succeeds', async () => {
    const coding = fakeAgent('coding', true);
    const debug = fakeAgent('debug', true);
    const orchestrator = new SequentialAgentOrchestrator(
      new Map([
        ['coding', coding],
        ['debug', debug],
      ]),
    );

    const plan = planWith([{ agentRole: 'coding', instruction: 'write the code' }]);
    const result = await orchestrator.run(plan);

    expect(result.success).toBe(true);
    expect(debug.calls).toHaveLength(0);
  });
});

function fakeAgentSucceedingOnAttempt(
  role: AgentTaskResult['role'],
  succeedOnAttempt: number,
): Agent & { calls: AgentTask[] } {
  const calls: AgentTask[] = [];
  return {
    role,
    calls,
    async run(task: AgentTask): Promise<AgentTaskResult> {
      calls.push(task);
      const succeed = calls.length >= succeedOnAttempt;
      return { role, success: succeed, output: succeed ? 'fixed' : 'still failing' };
    },
  };
}
