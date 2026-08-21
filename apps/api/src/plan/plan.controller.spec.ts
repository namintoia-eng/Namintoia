import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { AgentOrchestrator, OrchestrationResult, Plan, ReasoningEngine } from '@namintoia/naminto-core';
import { describe, expect, it } from 'vitest';
import { AGENT_ORCHESTRATOR, REASONING_ENGINE } from '../naminto-core/naminto-core.module';
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

async function buildController(
  reasoningEngine: Partial<ReasoningEngine>,
  orchestrator: Partial<AgentOrchestrator>,
): Promise<PlanController> {
  const moduleRef = await Test.createTestingModule({
    controllers: [PlanController],
    providers: [
      { provide: REASONING_ENGINE, useValue: reasoningEngine },
      { provide: AGENT_ORCHESTRATOR, useValue: orchestrator },
    ],
  }).compile();

  return moduleRef.get(PlanController);
}

describe('PlanController', () => {
  it('turns an intent into a Plan and runs it, returning both', async () => {
    const planFromIntent = async (intent: string): Promise<Plan> => ({ ...FAKE_PLAN, intent });
    const run = async (): Promise<OrchestrationResult> => FAKE_RESULT;

    const controller = await buildController({ planFromIntent }, { run });

    const response = await controller.createAndRun({ intent: 'build a login form' });

    expect(response.plan.intent).toBe('build a login form');
    expect(response.result).toEqual(FAKE_RESULT);
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
});
