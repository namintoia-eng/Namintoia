import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Project, ProjectSystem, User, UserSystem } from '@namintoia/naminto-core';
import { describe, expect, it } from 'vitest';
import { PROJECT_SYSTEM, USER_SYSTEM } from '../naminto-core/naminto-core.module';
import { ProjectController } from './project.controller';

const USER_A: User = { id: 'user-a', email: 'a@example.com', createdAt: '2026-08-21T00:00:00.000Z' };

function fakeUserSystem(): UserSystem {
  return {
    name: 'fake-user-system',
    register: async () => USER_A,
    authenticate: async () => {
      throw new Error('not used in these tests');
    },
    verifySession: async () => USER_A,
  };
}

async function buildController(projectSystem: Partial<ProjectSystem>): Promise<ProjectController> {
  const moduleRef = await Test.createTestingModule({
    controllers: [ProjectController],
    providers: [
      { provide: PROJECT_SYSTEM, useValue: projectSystem },
      { provide: USER_SYSTEM, useValue: fakeUserSystem() },
    ],
  }).compile();

  return moduleRef.get(ProjectController);
}

describe('ProjectController', () => {
  describe('create', () => {
    it('creates a project owned by the current user', async () => {
      const created: Project = {
        id: 'proj-1',
        ownerId: USER_A.id,
        name: 'Website Refresh',
        createdAt: '2026-08-22T00:00:00.000Z',
      };
      const controller = await buildController({ createProject: async () => created });

      const project = await controller.create(USER_A, { name: 'Website Refresh' });

      expect(project).toEqual(created);
    });

    it('rejects a missing name', async () => {
      const controller = await buildController({});
      await expect(controller.create(USER_A, {})).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects an empty/whitespace name', async () => {
      const controller = await buildController({});
      await expect(controller.create(USER_A, { name: '   ' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('list', () => {
    it("returns only the current user's projects, as given by the injected ProjectSystem", async () => {
      const projects: Project[] = [
        { id: 'proj-1', ownerId: USER_A.id, name: 'A1', createdAt: '2026-08-22T00:00:00.000Z' },
        { id: 'proj-2', ownerId: USER_A.id, name: 'A2', createdAt: '2026-08-22T00:00:00.000Z' },
      ];
      const controller = await buildController({ listProjects: async () => projects });

      const result = await controller.list(USER_A);

      expect(result).toEqual({ projects });
    });
  });
});
