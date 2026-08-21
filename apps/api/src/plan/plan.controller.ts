import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import type {
  AgentOrchestrator,
  ConversationTurn,
  FileSystem,
  MemoryStore,
  OrchestrationResult,
  Plan,
  Project,
  ProjectSystem,
  ReasoningEngine,
  User,
} from '@namintoia/naminto-core';
import { CurrentUser } from '../auth/current-user.decorator';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import {
  AGENT_ORCHESTRATOR,
  FILE_SYSTEM,
  MEMORY_STORE,
  PROJECT_SYSTEM,
  REASONING_ENGINE,
} from '../naminto-core/naminto-core.module';

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
 * Every route resolves the projectId against ProjectSystem first (real
 * ownership check, DECISIONS.md D-16) — a 404 for both "doesn't exist" and
 * "belongs to someone else", no enumeration. Internal calls still go
 * through scopeProjectId (userId:projectId, D-14) on top of that as
 * defense in depth: a future route that forgot the ownership check could
 * still only ever touch the current user's own namespace.
 */
@Controller('plan')
@UseGuards(SessionAuthGuard)
export class PlanController {
  constructor(
    @Inject(REASONING_ENGINE) private readonly reasoningEngine: ReasoningEngine,
    @Inject(AGENT_ORCHESTRATOR) private readonly orchestrator: AgentOrchestrator,
    @Inject(MEMORY_STORE) private readonly memory: MemoryStore,
    @Inject(FILE_SYSTEM) private readonly fileSystem: FileSystem,
    @Inject(PROJECT_SYSTEM) private readonly projects: ProjectSystem,
  ) {}

  @Post()
  async createAndRun(@CurrentUser() user: User, @Body() body: unknown): Promise<RunPlanResponse> {
    const { intent, projectId } = extractRequest(body);
    const project = await this.resolveProject(user, projectId);
    const scopedProjectId = scopeProjectId(user.id, project.id);
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
    const project = await this.resolveProject(user, projectId);
    const turns = await this.memory.listTurns(scopeProjectId(user.id, project.id));
    return { projectId, turns };
  }

  @Get(':projectId/files')
  async files(
    @CurrentUser() user: User,
    @Param('projectId') projectId: string,
  ): Promise<ProjectFilesResponse> {
    const project = await this.resolveProject(user, projectId);
    const files = await this.fileSystem.listProjectFiles(scopeProjectId(user.id, project.id));
    return { projectId, files };
  }

  private async resolveProject(user: User, projectId: string): Promise<Project> {
    const project = await this.projects.getProject(user.id, projectId);
    if (!project) {
      throw new NotFoundException('No such project.');
    }
    return project;
  }
}

function scopeProjectId(userId: string, projectId: string): string {
  return `${userId}:${projectId}`;
}

function extractRequest(body: unknown): { intent: string; projectId: string } {
  if (typeof body !== 'object' || body === null) {
    throw new BadRequestException(
      'Request body must be { "intent": "<non-empty string>", "projectId": "<non-empty string>" }.',
    );
  }
  const record = body as Record<string, unknown>;

  const intent = record['intent'];
  if (typeof intent !== 'string' || intent.trim().length === 0) {
    throw new BadRequestException('"intent" must be a non-empty string.');
  }

  const projectId = record['projectId'];
  if (typeof projectId !== 'string' || projectId.trim().length === 0) {
    throw new BadRequestException('"projectId" must be a non-empty string.');
  }

  return { intent, projectId };
}
