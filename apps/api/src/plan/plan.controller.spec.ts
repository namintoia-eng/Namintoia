import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { MessageEvent } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { lastValueFrom, type Observable } from 'rxjs';
import { toArray } from 'rxjs/operators';
import type {
  AgentOrchestrator,
  ConversationTurn,
  FileSystem,
  MemoryStore,
  NewConversationTurn,
  OrchestrationResult,
  Plan,
  Project,
  ProjectFile,
  ProjectSystem,
  ReasoningEngine,
  User,
  UserSystem,
} from '@namintoia/naminto-core';
import { describe, expect, it } from 'vitest';
import {
  AGENT_ORCHESTRATOR,
  FILE_SYSTEM,
  MEMORY_STORE,
  PROJECT_SYSTEM,
  REASONING_ENGINE,
  USER_SYSTEM,
} from '../naminto-core/naminto-core.module';
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

const USER_A: User = { id: 'user-a', email: 'a@example.com', createdAt: '2026-08-21T00:00:00.000Z' };
const USER_B: User = { id: 'user-b', email: 'b@example.com', createdAt: '2026-08-21T00:00:00.000Z' };

const PROJECT_A: Project = {
  id: 'proj-1',
  ownerId: USER_A.id,
  name: 'Project A',
  createdAt: '2026-08-21T00:00:00.000Z',
};
const PROJECT_B: Project = {
  id: 'proj-b1',
  ownerId: USER_B.id,
  name: 'Project B',
  createdAt: '2026-08-21T00:00:00.000Z',
};

function fakeMemoryStore(): MemoryStore & { saved: NewConversationTurn[] } {
  const saved: NewConversationTurn[] = [];
  return {
    name: 'fake-memory',
    saved,
    async saveTurn(turn: NewConversationTurn): Promise<ConversationTurn> {
      saved.push(turn);
      return { ...turn, id: 'turn_1', createdAt: '2026-08-21T00:00:00.000Z' };
    },
    async listTurns(projectId: string): Promise<ConversationTurn[]> {
      return saved
        .filter((t) => t.projectId === projectId)
        .map((t, i) => ({ ...t, id: `turn_${i}`, createdAt: '2026-08-21T00:00:00.000Z' }));
    },
    async deleteProject() {
      // not used in these tests
    },
  };
}

function fakeFileSystem(): FileSystem & { saved: { projectId: string; files: ProjectFile[] }[] } {
  const saved: { projectId: string; files: ProjectFile[] }[] = [];
  return {
    name: 'fake-file-system',
    saved,
    async saveProjectFiles(projectId: string, files: ProjectFile[]) {
      saved.push({ projectId, files });
    },
    async listProjectFiles(projectId: string) {
      const match = saved.filter((s) => s.projectId === projectId).at(-1);
      return match ? match.files.map((f) => f.path) : [];
    },
    async readProjectFile(projectId: string, path: string) {
      const match = saved.filter((s) => s.projectId === projectId).at(-1);
      const file = match?.files.find((f) => f.path === path);
      if (!file) {
        const error = new Error(`no such file: ${path}`) as NodeJS.ErrnoException;
        error.code = 'ENOENT';
        throw error;
      }
      return file.content;
    },
    async deleteProject() {
      // not used in these tests
    },
  };
}

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

function fakeProjectSystem(projects: Project[] = [PROJECT_A, PROJECT_B]): ProjectSystem {
  return {
    name: 'fake-project-system',
    createProject: async () => {
      throw new Error('not used in these tests');
    },
    listProjects: async (ownerId) => projects.filter((p) => p.ownerId === ownerId),
    getProject: async (ownerId, projectId) =>
      projects.find((p) => p.id === projectId && p.ownerId === ownerId) ?? null,
    renameProject: async () => {
      throw new Error('not used in these tests');
    },
    deleteProject: async () => {
      // not used in these tests
    },
  };
}

async function buildController(
  reasoningEngine: Partial<ReasoningEngine>,
  orchestrator: Partial<AgentOrchestrator>,
  memory: MemoryStore = fakeMemoryStore(),
  fileSystem: FileSystem = fakeFileSystem(),
  projectSystem: ProjectSystem = fakeProjectSystem(),
): Promise<PlanController> {
  const moduleRef = await Test.createTestingModule({
    controllers: [PlanController],
    providers: [
      { provide: REASONING_ENGINE, useValue: reasoningEngine },
      { provide: AGENT_ORCHESTRATOR, useValue: orchestrator },
      { provide: MEMORY_STORE, useValue: memory },
      { provide: FILE_SYSTEM, useValue: fileSystem },
      { provide: USER_SYSTEM, useValue: fakeUserSystem() },
      { provide: PROJECT_SYSTEM, useValue: projectSystem },
    ],
  }).compile();

  return moduleRef.get(PlanController);
}

/** Collects every SSE event a streaming createAndRun() Observable emits, in order. */
async function collectEvents(observable: Observable<MessageEvent>): Promise<{ type: string }[]> {
  const events = await lastValueFrom(observable.pipe(toArray()));
  return events.map((e) => e.data as { type: string });
}

describe('PlanController', () => {
  it('streams planning/plan_ready/done events, with the Plan and turn id in done', async () => {
    const planFromIntent = async (intent: string): Promise<Plan> => ({ ...FAKE_PLAN, intent });
    const run = async (): Promise<OrchestrationResult> => FAKE_RESULT;

    const controller = await buildController({ planFromIntent }, { run });

    const observable = await controller.createAndRun(USER_A, {
      intent: 'build a login form',
      projectId: PROJECT_A.id,
    });
    const events = await collectEvents(observable);

    expect(events.map((e) => e.type)).toEqual(['planning', 'plan_ready', 'done']);
    const done = events.at(-1) as { type: 'done'; plan: Plan; result: OrchestrationResult; turnId: string };
    expect(done.plan.intent).toBe('build a login form');
    expect(done.result).toEqual(FAKE_RESULT);
    expect(done.turnId).toBeTruthy();
  });

  it('passes through task_start/task_output/task_complete events from the orchestrator', async () => {
    const controller = await buildController(
      { planFromIntent: async (intent) => ({ ...FAKE_PLAN, intent }) },
      {
        run: async (_plan, _projectId, onTaskEvent) => {
          onTaskEvent?.({ type: 'task_start', role: 'coding', instruction: 'do it' });
          onTaskEvent?.({ type: 'task_output', role: 'coding', data: 'writing file...\n' });
          onTaskEvent?.({ type: 'task_complete', role: 'coding', success: true, output: 'ok' });
          return FAKE_RESULT;
        },
      },
    );

    const events = await collectEvents(
      await controller.createAndRun(USER_A, { intent: 'x', projectId: PROJECT_A.id }),
    );

    expect(events.map((e) => e.type)).toEqual([
      'planning',
      'plan_ready',
      'task_start',
      'task_output',
      'task_complete',
      'done',
    ]);
  });

  it('saves the turn under the given projectId, scoped to the user', async () => {
    const memory = fakeMemoryStore();
    const controller = await buildController(
      { planFromIntent: async (intent) => ({ ...FAKE_PLAN, intent }) },
      { run: async () => FAKE_RESULT },
      memory,
    );

    const observable = await controller.createAndRun(USER_A, {
      intent: 'build a login form',
      projectId: PROJECT_A.id,
    });
    await collectEvents(observable);

    expect(memory.saved[0]?.projectId).toBe(`user-a:${PROJECT_A.id}`);
  });

  it('returns a project history via GET, with the client-facing projectId in the response', async () => {
    const memory = fakeMemoryStore();
    const controller = await buildController(
      { planFromIntent: async (intent) => ({ ...FAKE_PLAN, intent }) },
      { run: async () => FAKE_RESULT },
      memory,
    );

    await collectEvents(
      await controller.createAndRun(USER_A, { intent: 'first', projectId: PROJECT_A.id }),
    );
    await collectEvents(
      await controller.createAndRun(USER_A, { intent: 'second', projectId: PROJECT_A.id }),
    );

    const history = await controller.history(USER_A, PROJECT_A.id);

    expect(history.projectId).toBe(PROJECT_A.id);
    expect(history.turns).toHaveLength(2);
  });

  it("returns a project's captured files via GET", async () => {
    const fileSystem = fakeFileSystem();
    const controller = await buildController(
      { planFromIntent: async (intent) => ({ ...FAKE_PLAN, intent }) },
      { run: async () => FAKE_RESULT },
      fakeMemoryStore(),
      fileSystem,
    );
    fileSystem.saved.push({
      projectId: `user-a:${PROJECT_A.id}`,
      files: [{ path: 'hello.txt', content: 'hi' }],
    });

    const files = await controller.files(USER_A, PROJECT_A.id);

    expect(files).toEqual({ projectId: PROJECT_A.id, files: ['hello.txt'] });
  });

  it('rejects a request without an intent field', async () => {
    const controller = await buildController(
      { planFromIntent: async () => FAKE_PLAN },
      { run: async () => FAKE_RESULT },
    );

    await expect(
      controller.createAndRun(USER_A, { projectId: PROJECT_A.id }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a request with an empty intent', async () => {
    const controller = await buildController(
      { planFromIntent: async () => FAKE_PLAN },
      { run: async () => FAKE_RESULT },
    );

    await expect(
      controller.createAndRun(USER_A, { intent: '   ', projectId: PROJECT_A.id }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a request without a projectId', async () => {
    const controller = await buildController(
      { planFromIntent: async () => FAKE_PLAN },
      { run: async () => FAKE_RESULT },
    );

    await expect(controller.createAndRun(USER_A, { intent: 'x' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects a request with a non-string projectId', async () => {
    const controller = await buildController(
      { planFromIntent: async () => FAKE_PLAN },
      { run: async () => FAKE_RESULT },
    );

    await expect(
      controller.createAndRun(USER_A, { intent: 'x', projectId: 42 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns 404 for an unknown projectId on POST /plan', async () => {
    const controller = await buildController(
      { planFromIntent: async () => FAKE_PLAN },
      { run: async () => FAKE_RESULT },
    );

    await expect(
      controller.createAndRun(USER_A, { intent: 'x', projectId: 'does-not-exist' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("returns 404 when a user requests another user's project on POST /plan", async () => {
    const controller = await buildController(
      { planFromIntent: async () => FAKE_PLAN },
      { run: async () => FAKE_RESULT },
    );

    await expect(
      controller.createAndRun(USER_A, { intent: 'x', projectId: PROJECT_B.id }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("returns 404 when a user requests another user's project history", async () => {
    const controller = await buildController(
      { planFromIntent: async () => FAKE_PLAN },
      { run: async () => FAKE_RESULT },
    );

    await expect(controller.history(USER_A, PROJECT_B.id)).rejects.toBeInstanceOf(NotFoundException);
  });

  it("returns 404 when a user requests another user's project files", async () => {
    const controller = await buildController(
      { planFromIntent: async () => FAKE_PLAN },
      { run: async () => FAKE_RESULT },
    );

    await expect(controller.files(USER_A, PROJECT_B.id)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns 404 for an unknown projectId on GET history/files', async () => {
    const controller = await buildController(
      { planFromIntent: async () => FAKE_PLAN },
      { run: async () => FAKE_RESULT },
    );

    await expect(controller.history(USER_A, 'does-not-exist')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(controller.files(USER_A, 'does-not-exist')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  describe('fileContent', () => {
    it("returns a project file's content", async () => {
      const fileSystem = fakeFileSystem();
      const controller = await buildController(
        { planFromIntent: async () => FAKE_PLAN },
        { run: async () => FAKE_RESULT },
        fakeMemoryStore(),
        fileSystem,
      );
      fileSystem.saved.push({
        projectId: `user-a:${PROJECT_A.id}`,
        files: [{ path: 'hello.txt', content: 'hello world' }],
      });

      const response = await controller.fileContent(USER_A, PROJECT_A.id, 'hello.txt');

      expect(response).toEqual({ path: 'hello.txt', content: 'hello world' });
    });

    it('returns 404 for an unknown file path', async () => {
      const fileSystem = fakeFileSystem();
      const controller = await buildController(
        { planFromIntent: async () => FAKE_PLAN },
        { run: async () => FAKE_RESULT },
        fakeMemoryStore(),
        fileSystem,
      );
      fileSystem.saved.push({ projectId: `user-a:${PROJECT_A.id}`, files: [] });

      await expect(controller.fileContent(USER_A, PROJECT_A.id, 'missing.txt')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('rejects a missing path query parameter', async () => {
      const controller = await buildController(
        { planFromIntent: async () => FAKE_PLAN },
        { run: async () => FAKE_RESULT },
      );

      await expect(
        controller.fileContent(USER_A, PROJECT_A.id, undefined as unknown as string),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("returns 404 when a user requests another user's project file", async () => {
      const controller = await buildController(
        { planFromIntent: async () => FAKE_PLAN },
        { run: async () => FAKE_RESULT },
      );

      await expect(controller.fileContent(USER_A, PROJECT_B.id, 'hello.txt')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
