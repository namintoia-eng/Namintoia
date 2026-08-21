import { BadRequestException, Body, Controller, Inject, Post } from '@nestjs/common';
import type { AgentOrchestrator, OrchestrationResult, Plan, ReasoningEngine } from '@namintoia/naminto-core';
import { AGENT_ORCHESTRATOR, REASONING_ENGINE } from '../naminto-core/naminto-core.module';

interface RunPlanResponse {
  plan: Plan;
  result: OrchestrationResult;
}

@Controller('plan')
export class PlanController {
  constructor(
    @Inject(REASONING_ENGINE) private readonly reasoningEngine: ReasoningEngine,
    @Inject(AGENT_ORCHESTRATOR) private readonly orchestrator: AgentOrchestrator,
  ) {}

  @Post()
  async createAndRun(@Body() body: unknown): Promise<RunPlanResponse> {
    const intent = extractIntent(body);
    const plan = await this.reasoningEngine.planFromIntent(intent);
    const result = await this.orchestrator.run(plan);
    return { plan, result };
  }
}

function extractIntent(body: unknown): string {
  if (typeof body !== 'object' || body === null) {
    throw new BadRequestException('Request body must be { "intent": "<non-empty string>" }.');
  }
  const intent = (body as Record<string, unknown>)['intent'];
  if (typeof intent !== 'string' || intent.trim().length === 0) {
    throw new BadRequestException('Request body must be { "intent": "<non-empty string>" }.');
  }
  return intent;
}
