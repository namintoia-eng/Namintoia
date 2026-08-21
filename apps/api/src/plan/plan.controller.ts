import { BadRequestException, Body, Controller, Get, Inject, Param, Post, UseGuards } from '@nestjs/common';
import type {
  AgentOrchestrator,
  ConversationTurn,
  FileSystem,
  MemoryStore,
  OrchestrationResult,
  Plan,
  ReasoningEngine,
  User,
} from '@namintoia/naminto-core';
import { CurrentUser } from '../auth/current-user.decorator';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import {
  AGENT_ORCHESTRATOR,
  FILE_SYSTEM,
  MEMORY_STORE,
  REASONING_ENGINE,
} from '../naminto-core/naminto-core.module';

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

interface ProjectFilesResponse {
  projectId: string;
  files: string[];
}

/**
 * Every project is scoped to the authenticated user internally (userId:projectId)
 * so two accounts can never read each other's history/files by guessing the
 * same client-facing projectId (DECISIONS.md D-14) — there's no real Project
 * System yet, this is the smallest thing that makes "requires login" an
 * actual isolation boundary rather than a formality.
 */
@Controller('plan')
@UseGuards(SessionAuthGuard)
export class PlanController {
  constructor(
    @Inject(REASONING_ENGINE) private readonly reasoningEngine: ReasoningEngine,
    @Inject(AGENT_ORCHESTRATOR) private readonly orchestrator: AgentOrchestrator,
    @Inject(MEMORY_STORE) private readonly memory: MemoryStore,
    @Inject(FILE_SYSTEM) private readonly fileSystem: FileSystem,
  ) {}

  @Post()
  async createAndRun(@CurrentUser() user: User, @Body() body: unknown): Promise<RunPlanResponse> {
    const { intent, projectId } = extractRequest(body);
    const scopedProjectId = scopeProjectId(user.id, projectId);
    const plan = await this.reasoningEngine.planFromIntent(intent);
    const result = await this.orchestrator.run(plan, scopedProjectId);
    const turn = await this.memory.saveTurn({ projectId: scopedProjectId, intent, plan, result });
    return { plan, result, turnId: turn.id };
  }

  @Get(':projectId')
  async history(
    @CurrentUser() user: User,
    @Param('projectId') projectId: string,
  ): Promise<ProjectHistoryResponse> {
    const turns = await this.memory.listTurns(scopeProjectId(user.id, projectId));
    return { projectId, turns };
  }

  @Get(':projectId/files')
  async files(
    @CurrentUser() user: User,
    @Param('projectId') projectId: string,
  ): Promise<ProjectFilesResponse> {
    const files = await this.fileSystem.listProjectFiles(scopeProjectId(user.id, projectId));
    return { projectId, files };
  }
}

function scopeProjectId(userId: string, projectId: string): string {
  return `${userId}:${projectId}`;
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
