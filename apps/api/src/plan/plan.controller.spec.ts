import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type {
  AgentOrchestrator,
  ConversationTurn,
  MemoryStore,
  NewConversationTurn,
  OrchestrationResult,
  Plan,
  ReasoningEngine,
} from '@namintoia/naminto-core';
import { describe, expect, it } from 'vitest';
import { AGENT_ORCHESTRATOR, MEMORY_STORE, REASONING_ENGINE } from '../naminto-core/naminto-core.module';
import { PlanController } from './plan.controller';

const FAKE_PLAN: Plan = {
  intent: 'do something',
  spec: {
    objective: 'x',
    requirements: { functional: [], nonFunctional: [], constraints: [] },
    architecture: { modulesInvolved: [], newInterfaces: [] },
    components: [],
    interfaces: [],
  },
  tasks: [{ agentRole: 'coding', instruction: 'do it' }],
};

const FAKE_RESULT: OrchestrationResult = {
  plan: FAKE_PLAN,
  results: [{ role: 'coding', success: true, output: 'ok' }],
  success: true,
};

function fakeMemoryStore(): MemoryStore & { saved: NewConversationTurn[] } {
  const saved: NewConversationTurn[] = [];
  return {
    name: 'fake-memory',
    saved,
    async saveTurn(turn: NewConversationTurn): Promise<ConversationTurn> {
      saved.push(turn);
      return { ...turn, id: 'turn_1', createdAt: '2026-08-21T00:00:00.000Z' };
    },
    async listTurns(projectId: string): Promise<ConversationTurn[]> {
      return saved
        .filter((t) => t.projectId === projectId)
        .map((t, i) => ({ ...t, id: `turn_${i}`, createdAt: '2026-08-21T00:00:00.000Z' }));
    },
  };
}

async function buildController(
  reasoningEngine: Partial<ReasoningEngine>,
  orchestrator: Partial<AgentOrchestrator>,
  memory: MemoryStore = fakeMemoryStore(),
): Promise<PlanController> {
  const moduleRef = await Test.createTestingModule({
    controllers: [PlanController],
    providers: [
      { provide: REASONING_ENGINE, useValue: reasoningEngine },
      { provide: AGENT_ORCHESTRATOR, useValue: orchestrator },
      { provide: MEMORY_STORE, useValue: memory },
    ],
  }).compile();

  return moduleRef.get(PlanController);
}

describe('PlanController', () => {
  it('turns an intent into a Plan and runs it, returning both plus a turn id', async () => {
    const planFromIntent = async (intent: string): Promise<Plan> => ({ ...FAKE_PLAN, intent });
    const run = async (): Promise<OrchestrationResult> => FAKE_RESULT;

    const controller = await buildController({ planFromIntent }, { run });

    const response = await controller.createAndRun({ intent: 'build a login form' });

    expect(response.plan.intent).toBe('build a login form');
    expect(response.result).toEqual(FAKE_RESULT);
    expect(response.turnId).toBeTruthy();
  });

  it('saves the turn under the default project when no projectId is given', async () => {
    const memory = fakeMemoryStore();
    const controller = await buildController(
      { planFromIntent: async (intent) => ({ ...FAKE_PLAN, intent }) },
      { run: async () => FAKE_RESULT },
      memory,
    );

    await controller.createAndRun({ intent: 'build a login form' });

    expect(memory.saved).toHaveLength(1);
    expect(memory.saved[0]?.projectId).toBe('default');
  });

  it('saves the turn under the given projectId', async () => {
    const memory = fakeMemoryStore();
    const controller = await buildController(
      { planFromIntent: async (intent) => ({ ...FAKE_PLAN, intent }) },
      { run: async () => FAKE_RESULT },
      memory,
    );

    await controller.createAndRun({ intent: 'build a login form', projectId: 'proj-1' });

    expect(memory.saved[0]?.projectId).toBe('proj-1');
  });

  it('returns a project history via GET', async () => {
    const memory = fakeMemoryStore();
    const controller = await buildController(
      { planFromIntent: async (intent) => ({ ...FAKE_PLAN, intent }) },
      { run: async () => FAKE_RESULT },
      memory,
    );

    await controller.createAndRun({ intent: 'first', projectId: 'proj-1' });
    await controller.createAndRun({ intent: 'second', projectId: 'proj-1' });

    const history = await controller.history('proj-1');

    expect(history.projectId).toBe('proj-1');
    expect(history.turns).toHaveLength(2);
  });

  it('rejects a request without an intent field', async () => {
    const controller = await buildController(
      { planFromIntent: async () => FAKE_PLAN },
      { run: async () => FAKE_RESULT },
    );

    await expect(controller.createAndRun({})).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a request with an empty intent', async () => {
    const controller = await buildController(
      { planFromIntent: async () => FAKE_PLAN },
      { run: async () => FAKE_RESULT },
    );

    await expect(controller.createAndRun({ intent: '   ' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects a request with a non-string projectId', async () => {
    const controller = await buildController(
      { planFromIntent: async () => FAKE_PLAN },
      { run: async () => FAKE_RESULT },
    );

    await expect(
      controller.createAndRun({ intent: 'x', projectId: 42 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
