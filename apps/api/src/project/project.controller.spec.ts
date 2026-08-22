import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { FileSystem, MemoryStore, Project, ProjectSystem, User, UserSystem } from '@namintoia/naminto-core';
import { describe, expect, it } from 'vitest';
import { FILE_SYSTEM, MEMORY_STORE, PROJECT_SYSTEM, USER_SYSTEM } from '../naminto-core/naminto-core.module';
import { ProjectController } from './project.controller';

const USER_A: User = { id: 'user-a', email: 'a@example.com', createdAt: '2026-08-21T00:00:00.000Z' };
const PROJECT_A: Project = {
  id: 'proj-1',
  ownerId: USER_A.id,
  name: 'Website Refresh',
  createdAt: '2026-08-22T00:00:00.000Z',
};

function fakeUserSystem(): UserSystem {
  return {
    name: 'fake-user-system',
    register: async () => USER_A,
    authenticate: async () => {
      throw new Error('not used in these tests');
    },
    authenticateExternal: async () => {
      throw new Error('not used in these tests');
    },
    verifySession: async () => USER_A,
  };
}

function fakeMemoryStore(): MemoryStore & { deletedProjects: string[] } {
  const deletedProjects: string[] = [];
  return {
    name: 'fake-memory',
    deletedProjects,
    saveTurn: async () => {
      throw new Error('not used in these tests');
    },
    listTurns: async () => [],
    async deleteProject(projectId: string) {
      deletedProjects.push(projectId);
    },
  };
}

function fakeFileSystem(): FileSystem & { deletedProjects: string[] } {
  const deletedProjects: string[] = [];
  return {
    name: 'fake-file-system',
    deletedProjects,
    saveProjectFiles: async () => undefined,
    listProjectFiles: async () => [],
    readProjectFile: async () => '',
    async deleteProject(projectId: string) {
      deletedProjects.push(projectId);
    },
  };
}

async function buildController(
  projectSystem: Partial<ProjectSystem>,
  memory: MemoryStore = fakeMemoryStore(),
  fileSystem: FileSystem = fakeFileSystem(),
): Promise<ProjectController> {
  const moduleRef = await Test.createTestingModule({
    controllers: [ProjectController],
    providers: [
      { provide: PROJECT_SYSTEM, useValue: projectSystem },
      { provide: MEMORY_STORE, useValue: memory },
      { provide: FILE_SYSTEM, useValue: fileSystem },
      { provide: USER_SYSTEM, useValue: fakeUserSystem() },
    ],
  }).compile();

  return moduleRef.get(ProjectController);
}

describe('ProjectController', () => {
  describe('create', () => {
    it('creates a project owned by the current user', async () => {
      const controller = await buildController({ createProject: async () => PROJECT_A });

      const project = await controller.create(USER_A, { name: 'Website Refresh' });

      expect(project).toEqual(PROJECT_A);
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

  describe('rename', () => {
    it('renames a project owned by the current user', async () => {
      const renamed = { ...PROJECT_A, name: 'New Name' };
      const controller = await buildController({
        getProject: async () => PROJECT_A,
        renameProject: async () => renamed,
      });

      const result = await controller.rename(USER_A, PROJECT_A.id, { name: 'New Name' });

      expect(result).toEqual(renamed);
    });

    it('returns 404 for an unknown or foreign project', async () => {
      const controller = await buildController({ getProject: async () => null });

      await expect(
        controller.rename(USER_A, 'does-not-exist', { name: 'New Name' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects an empty name', async () => {
      const controller = await buildController({ getProject: async () => PROJECT_A });

      await expect(controller.rename(USER_A, PROJECT_A.id, { name: '' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('remove', () => {
    it('deletes the project and cascades to memory and files, scoped to the user', async () => {
      const memory = fakeMemoryStore();
      const fileSystem = fakeFileSystem();
      let deletedFromProjectSystem: { ownerId: string; projectId: string } | null = null;
      const controller = await buildController(
        {
          getProject: async () => PROJECT_A,
          deleteProject: async (ownerId: string, projectId: string) => {
            deletedFromProjectSystem = { ownerId, projectId };
          },
        },
        memory,
        fileSystem,
      );

      const result = await controller.remove(USER_A, PROJECT_A.id);

      expect(result).toEqual({ success: true });
      expect(deletedFromProjectSystem).toEqual({ ownerId: USER_A.id, projectId: PROJECT_A.id });
      expect(memory.deletedProjects).toEqual([`${USER_A.id}:${PROJECT_A.id}`]);
      expect(fileSystem.deletedProjects).toEqual([`${USER_A.id}:${PROJECT_A.id}`]);
    });

    it('returns 404 for an unknown or foreign project', async () => {
      const controller = await buildController({ getProject: async () => null });

      await expect(controller.remove(USER_A, 'does-not-exist')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
