import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { FileSystem, MemoryStore, Project, ProjectSystem, User } from '@namintoia/naminto-core';
import { FILE_SYSTEM, MEMORY_STORE, PROJECT_SYSTEM } from '../naminto-core/naminto-core.module';
import { CurrentUser } from '../auth/current-user.decorator';
import { SessionAuthGuard } from '../auth/session-auth.guard';

interface ListProjectsResponse {
  projects: Project[];
}

/**
 * rename/delete resolve ownership first (same 404-not-403 pattern as
 * plan.controller.ts's resolveProject) before touching ProjectSystem —
 * those methods assume the caller is already authorized.
 */
@Controller('projects')
@UseGuards(SessionAuthGuard)
export class ProjectController {
  constructor(
    @Inject(PROJECT_SYSTEM) private readonly projects: ProjectSystem,
    @Inject(MEMORY_STORE) private readonly memory: MemoryStore,
    @Inject(FILE_SYSTEM) private readonly fileSystem: FileSystem,
  ) {}

  @Post()
  async create(@CurrentUser() user: User, @Body() body: unknown): Promise<Project> {
    const { name } = extractRequest(body);
    return this.projects.createProject(user.id, name);
  }

  @Get()
  async list(@CurrentUser() user: User): Promise<ListProjectsResponse> {
    const projects = await this.projects.listProjects(user.id);
    return { projects };
  }

  @Patch(':projectId')
  async rename(
    @CurrentUser() user: User,
    @Param('projectId') projectId: string,
    @Body() body: unknown,
  ): Promise<Project> {
    await this.resolveProject(user, projectId);
    const { name } = extractRequest(body);
    return this.projects.renameProject(user.id, projectId, name);
  }

  @Delete(':projectId')
  async remove(
    @CurrentUser() user: User,
    @Param('projectId') projectId: string,
  ): Promise<{ success: true }> {
    await this.resolveProject(user, projectId);
    const scopedProjectId = scopeProjectId(user.id, projectId);
    await this.projects.deleteProject(user.id, projectId);
    await this.memory.deleteProject(scopedProjectId);
    await this.fileSystem.deleteProject(scopedProjectId);
    return { success: true };
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

function extractRequest(body: unknown): { name: string } {
  if (typeof body !== 'object' || body === null) {
    throw new BadRequestException('Request body must be { "name": "<non-empty string>" }.');
  }
  const record = body as Record<string, unknown>;

  const name = record['name'];
  if (typeof name !== 'string' || name.trim().length === 0) {
    throw new BadRequestException('Request body must be { "name": "<non-empty string>" }.');
  }

  return { name };
}
