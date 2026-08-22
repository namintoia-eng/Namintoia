import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  Query,
  Sse,
  UseGuards,
} from '@nestjs/common';
import type { MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
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
  TaskProgressEvent,
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

/**
 * The full progress stream a POST /plan request emits (DECISIONS.md D-21)
 * — one uniform `data: {...}` JSON frame per event, never a bare SSE
 * `event:` field, so the client has a single parsing path including for
 * errors (see the manual try/catch below, never subscriber.error()).
 */
type PlanStreamEvent =
  | { type: 'planning' }
  | { type: 'plan_ready'; plan: Plan }
  | TaskProgressEvent
  | { type: 'done'; plan: Plan; result: OrchestrationResult; turnId: string }
  | { type: 'error'; message: string };

interface ProjectHistoryResponse {
  projectId: string;
  turns: ConversationTurn[];
}

interface ProjectFilesResponse {
  projectId: string;
  files: string[];
}

interface ProjectFileContentResponse {
  path: string;
  content: string;
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

  /**
   * `@Post()` must stay ABOVE `@Sse()`: decorators run bottom-to-top, and
   * `@Sse()` unconditionally forces the route's HTTP method metadata to GET
   * every time it runs — with `@Sse()` closest to the method it runs first
   * (setting GET), then `@Post()` runs second and overwrites the method
   * back to POST without touching the separate SSE flag. The reverse order
   * silently registers this route as GET (a POST call 404s at runtime, no
   * error at compile time or boot). Validation (extractRequest,
   * resolveProject) still throws/rejects normally here, before any
   * Observable exists, so invalid bodies and unknown/foreign projects keep
   * getting a plain 400/404 JSON response — only once validation succeeds
   * does the response switch to an SSE stream.
   */
  @Post()
  @Sse()
  async createAndRun(
    @CurrentUser() user: User,
    @Body() body: unknown,
  ): Promise<Observable<MessageEvent>> {
    const { intent, projectId } = extractRequest(body);
    const project = await this.resolveProject(user, projectId);
    const scopedProjectId = scopeProjectId(user.id, project.id);

    return new Observable<MessageEvent>((subscriber) => {
      const emit = (event: PlanStreamEvent): void => {
        subscriber.next({ data: event });
      };

      (async () => {
        try {
          emit({ type: 'planning' });
          const plan = await this.reasoningEngine.planFromIntent(intent);
          emit({ type: 'plan_ready', plan });
          const result = await this.orchestrator.run(plan, scopedProjectId, emit);
          const turn = await this.memory.saveTurn({ projectId: scopedProjectId, intent, plan, result });
          emit({ type: 'done', plan, result, turnId: turn.id });
          subscriber.complete();
        } catch (error) {
          emit({ type: 'error', message: error instanceof Error ? error.message : 'Erreur inconnue.' });
          subscriber.complete();
        }
      })();
    });
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

  @Get(':projectId/file')
  async fileContent(
    @CurrentUser() user: User,
    @Param('projectId') projectId: string,
    @Query('path') path: string,
  ): Promise<ProjectFileContentResponse> {
    const project = await this.resolveProject(user, projectId);
    if (typeof path !== 'string' || path.trim().length === 0) {
      throw new BadRequestException('"path" query parameter is required.');
    }
    try {
      const content = await this.fileSystem.readProjectFile(scopeProjectId(user.id, project.id), path);
      return { path, content };
    } catch (error) {
      if (isNotFoundError(error)) {
        throw new NotFoundException('No such file.');
      }
      throw error;
    }
  }

  private async resolveProject(user: User, projectId: string): Promise<Project> {
    const project = await this.projects.getProject(user.id, projectId);
    if (!project) {
      throw new NotFoundException('No such project.');
    }
    return project;
  }
}

function isNotFoundError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === 'ENOENT'
  );
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
