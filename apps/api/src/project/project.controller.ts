import { BadRequestException, Body, Controller, Get, Inject, Post, UseGuards } from '@nestjs/common';
import type { Project, ProjectSystem, User } from '@namintoia/naminto-core';
import { PROJECT_SYSTEM } from '../naminto-core/naminto-core.module';
import { CurrentUser } from '../auth/current-user.decorator';
import { SessionAuthGuard } from '../auth/session-auth.guard';

interface ListProjectsResponse {
  projects: Project[];
}

@Controller('projects')
@UseGuards(SessionAuthGuard)
export class ProjectController {
  constructor(@Inject(PROJECT_SYSTEM) private readonly projects: ProjectSystem) {}

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
