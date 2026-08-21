import { BadRequestException, Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import type {
  AgentOrchestrator,
  ConversationTurn,
  MemoryStore,
  OrchestrationResult,
  Plan,
  ReasoningEngine,
} from '@namintoia/naminto-core';
import { AGENT_ORCHESTRATOR, MEMORY_STORE, REASONING_ENGINE } from '../naminto-core/naminto-core.module';

const DEFAULT_PROJECT_ID = 'default';

interface RunPlanResponse {
  plan: Plan;
  result: OrchestrationResult;
  turnId: string;
}

interface ProjectHistoryResponse {
  projectId: string;
  turns: ConversationTurn[];
}

@Controller('plan')
export class PlanController {
  constructor(
    @Inject(REASONING_ENGINE) private readonly reasoningEngine: ReasoningEngine,
    @Inject(AGENT_ORCHESTRATOR) private readonly orchestrator: AgentOrchestrator,
    @Inject(MEMORY_STORE) private readonly memory: MemoryStore,
  ) {}

  @Post()
  async createAndRun(@Body() body: unknown): Promise<RunPlanResponse> {
    const { intent, projectId } = extractRequest(body);
    const plan = await this.reasoningEngine.planFromIntent(intent);
    const result = await this.orchestrator.run(plan, projectId);
    const turn = await this.memory.saveTurn({ projectId, intent, plan, result });
    return { plan, result, turnId: turn.id };
  }

  @Get(':projectId')
  async history(@Param('projectId') projectId: string): Promise<ProjectHistoryResponse> {
    const turns = await this.memory.listTurns(projectId);
    return { projectId, turns };
  }
}

function extractRequest(body: unknown): { intent: string; projectId: string } {
  if (typeof body !== 'object' || body === null) {
    throw new BadRequestException('Request body must be { "intent": "<non-empty string>" }.');
  }
  const record = body as Record<string, unknown>;

  const intent = record['intent'];
  if (typeof intent !== 'string' || intent.trim().length === 0) {
    throw new BadRequestException('Request body must be { "intent": "<non-empty string>" }.');
  }

  const projectId = record['projectId'];
  if (projectId !== undefined && (typeof projectId !== 'string' || projectId.trim().length === 0)) {
    throw new BadRequestException('"projectId", if provided, must be a non-empty string.');
  }

  return { intent, projectId: (projectId as string | undefined) ?? DEFAULT_PROJECT_ID };
}
