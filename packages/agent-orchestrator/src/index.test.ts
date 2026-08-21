import type {
  Agent,
  AgentRunContext,
  AgentTask,
  AgentTaskResult,
  FileSystem,
  Plan,
  ProjectFile,
  SandboxFileEntry,
  SandboxProvider,
  SandboxSession,
} from '@namintoia/naminto-core';
import { describe, expect, it } from 'vitest';
import { SequentialAgentOrchestrator } from './index.js';

function fakeAgent(
  role: AgentTaskResult['role'],
  succeed: boolean,
): Agent & { calls: AgentRunContext[] } {
  const calls: AgentRunContext[] = [];
  return {
    role,
    calls,
    async run(_task: AgentTask, context: AgentRunContext): Promise<AgentTaskResult> {
      calls.push(context);
      return { role, success: succeed, output: succeed ? 'ok' : 'failed' };
    },
  };
}

function fakeAgentSucceedingOnAttempt(
  role: AgentTaskResult['role'],
  succeedOnAttempt: number,
): Agent & { calls: AgentRunContext[] } {
  const calls: AgentRunContext[] = [];
  return {
    role,
    calls,
    async run(_task: AgentTask, context: AgentRunContext): Promise<AgentTaskResult> {
      calls.push(context);
      const succeed = calls.length >= succeedOnAttempt;
      return { role, success: succeed, output: succeed ? 'fixed' : 'still failing' };
    },
  };
}

function fakeSandboxProvider(
  files: SandboxFileEntry[] = [],
  fileContents: Record<string, string> = {},
): SandboxProvider & { sessions: (SandboxSession & { closed: boolean })[] } {
  const sessions: (SandboxSession & { closed: boolean })[] = [];
  return {
    name: 'fake-sandbox',
    sessions,
    async createSession(projectId: string) {
      const session: SandboxSession & { closed: boolean } = {
        id: `${projectId}-session-${sessions.length}`,
        closed: false,
        async execute() {
          return { exitCode: 0, timedOut: false, durationMs: 1 };
        },
        async listFiles() {
          return files;
        },
        async readFile(path: string) {
          return fileContents[path] ?? '';
        },
        async close() {
          session.closed = true;
        },
      };
      sessions.push(session);
      return session;
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
    async listProjectFiles() {
      return [];
    },
    async readProjectFile() {
      return '';
    },
  };
}

function planWith(tasks: AgentTask[]): Plan {
  return {
    intent: 'test intent',
    spec: {
      objective: 'x',
      requirements: { functional: [], nonFunctional: [], constraints: [] },
      architecture: { modulesInvolved: [], newInterfaces: [] },
      components: [],
      interfaces: [],
    },
    tasks,
  };
}

describe('SequentialAgentOrchestrator', () => {
  it('runs tasks in order and reports success when every task succeeds', async () => {
    const coding = fakeAgent('coding', true);
    const testing = fakeAgent('testing', true);
    const sandbox = fakeSandboxProvider();
    const orchestrator = new SequentialAgentOrchestrator(
      new Map([
        ['coding', coding],
        ['testing', testing],
      ]),
      sandbox,
      fakeFileSystem(),
    );

    const plan = planWith([
      { agentRole: 'coding', instruction: 'write the code' },
      { agentRole: 'testing', instruction: 'write the tests' },
    ]);

    const result = await orchestrator.run(plan, 'proj-1');

    expect(result.success).toBe(true);
    expect(result.results.map((r) => r.role)).toEqual(['coding', 'testing']);
    expect(coding.calls).toHaveLength(1);
    expect(testing.calls).toHaveLength(1);
  });

  it('shares the same sandbox session across every task in the plan', async () => {
    const coding = fakeAgent('coding', true);
    const testing = fakeAgent('testing', true);
    const sandbox = fakeSandboxProvider();
    const orchestrator = new SequentialAgentOrchestrator(
      new Map([
        ['coding', coding],
        ['testing', testing],
      ]),
      sandbox,
      fakeFileSystem(),
    );

    const plan = planWith([
      { agentRole: 'coding', instruction: 'write the code' },
      { agentRole: 'testing', instruction: 'write the tests' },
    ]);

    await orchestrator.run(plan, 'proj-1');

    expect(sandbox.sessions).toHaveLength(1);
    const [session] = sandbox.sessions;
    expect(coding.calls[0]?.sandboxSession).toBe(session);
    expect(testing.calls[0]?.sandboxSession).toBe(session);
  });

  it('closes the sandbox session even when a task fails', async () => {
    const coding = fakeAgent('coding', false);
    const sandbox = fakeSandboxProvider();
    const orchestrator = new SequentialAgentOrchestrator(
      new Map([['coding', coding]]),
      sandbox,
      fakeFileSystem(),
    );

    await orchestrator.run(planWith([{ agentRole: 'coding', instruction: 'write the code' }]), 'proj-1');

    expect(sandbox.sessions[0]?.closed).toBe(true);
  });

  it('closes the sandbox session even when an agent throws', async () => {
    const throwing: Agent = {
      role: 'coding',
      async run() {
        throw new Error('boom');
      },
    };
    const sandbox = fakeSandboxProvider();
    const orchestrator = new SequentialAgentOrchestrator(
      new Map([['coding', throwing]]),
      sandbox,
      fakeFileSystem(),
    );

    await expect(
      orchestrator.run(planWith([{ agentRole: 'coding', instruction: 'x' }]), 'proj-1'),
    ).rejects.toThrow('boom');

    expect(sandbox.sessions[0]?.closed).toBe(true);
  });

  it('stops at the first failed task instead of running the rest', async () => {
    const coding = fakeAgent('coding', false);
    const testing = fakeAgent('testing', true);
    const sandbox = fakeSandboxProvider();
    const orchestrator = new SequentialAgentOrchestrator(
      new Map([
        ['coding', coding],
        ['testing', testing],
      ]),
      sandbox,
      fakeFileSystem(),
    );

    const plan = planWith([
      { agentRole: 'coding', instruction: 'write the code' },
      { agentRole: 'testing', instruction: 'write the tests' },
    ]);

    const result = await orchestrator.run(plan, 'proj-1');

    expect(result.success).toBe(false);
    expect(result.results).toHaveLength(1);
    expect(testing.calls).toHaveLength(0);
  });

  it('throws a clear error when a task needs an unregistered agent role', async () => {
    const orchestrator = new SequentialAgentOrchestrator(
      new Map(),
      fakeSandboxProvider(),
      fakeFileSystem(),
    );
    const plan = planWith([{ agentRole: 'debug', instruction: 'fix it' }]);

    await expect(orchestrator.run(plan, 'proj-1')).rejects.toThrow(
      /no agent registered for role "debug"/,
    );
  });

  it('hands a failed task to the debug agent and succeeds once the fix works', async () => {
    const coding = fakeAgent('coding', false);
    const debug = fakeAgentSucceedingOnAttempt('debug', 2);
    const sandbox = fakeSandboxProvider();
    const orchestrator = new SequentialAgentOrchestrator(
      new Map([
        ['coding', coding],
        ['debug', debug],
      ]),
      sandbox,
      fakeFileSystem(),
    );

    const plan = planWith([{ agentRole: 'coding', instruction: 'write the code' }]);
    const result = await orchestrator.run(plan, 'proj-1');

    expect(result.success).toBe(true);
    expect(debug.calls).toHaveLength(2);
    // coding result + 2 debug attempts
    expect(result.results).toHaveLength(3);
  });

  it('stops after the bounded number of debug attempts and surfaces the failure', async () => {
    const coding = fakeAgent('coding', false);
    const debug = fakeAgent('debug', false);
    const sandbox = fakeSandboxProvider();
    const orchestrator = new SequentialAgentOrchestrator(
      new Map([
        ['coding', coding],
        ['debug', debug],
      ]),
      sandbox,
      fakeFileSystem(),
      { maxDebugAttempts: 3 },
    );

    const plan = planWith([{ agentRole: 'coding', instruction: 'write the code' }]);
    const result = await orchestrator.run(plan, 'proj-1');

    expect(result.success).toBe(false);
    expect(debug.calls).toHaveLength(3);
    expect(result.results).toHaveLength(4); // coding result + 3 debug attempts
  });

  it('never invokes the debug agent when every task already succeeds', async () => {
    const coding = fakeAgent('coding', true);
    const debug = fakeAgent('debug', true);
    const sandbox = fakeSandboxProvider();
    const orchestrator = new SequentialAgentOrchestrator(
      new Map([
        ['coding', coding],
        ['debug', debug],
      ]),
      sandbox,
      fakeFileSystem(),
    );

    const plan = planWith([{ agentRole: 'coding', instruction: 'write the code' }]);
    const result = await orchestrator.run(plan, 'proj-1');

    expect(result.success).toBe(true);
    expect(debug.calls).toHaveLength(0);
  });

  it('captures files from the sandbox into the FileSystem before closing the session', async () => {
    const coding = fakeAgent('coding', true);
    const sandbox = fakeSandboxProvider(
      [
        { path: '/home/user/project/hello.txt', type: 'file' },
        { path: '/home/user/project/src', type: 'directory' },
        { path: '/home/user/project/src/index.ts', type: 'file' },
      ],
      {
        '/home/user/project/hello.txt': 'hello',
        '/home/user/project/src/index.ts': 'export {}',
      },
    );
    const fileSystem = fakeFileSystem();
    const orchestrator = new SequentialAgentOrchestrator(
      new Map([['coding', coding]]),
      sandbox,
      fileSystem,
    );

    await orchestrator.run(planWith([{ agentRole: 'coding', instruction: 'write the code' }]), 'proj-1');

    expect(fileSystem.saved).toHaveLength(1);
    expect(fileSystem.saved[0]?.projectId).toBe('proj-1');
    expect(fileSystem.saved[0]?.files).toEqual([
      { path: 'hello.txt', content: 'hello' },
      { path: 'src/index.ts', content: 'export {}' },
    ]);
  });

  it('captures files even when the plan fails', async () => {
    const coding = fakeAgent('coding', false);
    const sandbox = fakeSandboxProvider([{ path: '/home/user/project/partial.txt', type: 'file' }], {
      '/home/user/project/partial.txt': 'partial work',
    });
    const fileSystem = fakeFileSystem();
    const orchestrator = new SequentialAgentOrchestrator(
      new Map([['coding', coding]]),
      sandbox,
      fileSystem,
    );

    await orchestrator.run(planWith([{ agentRole: 'coding', instruction: 'write the code' }]), 'proj-1');

    expect(fileSystem.saved[0]?.files).toEqual([{ path: 'partial.txt', content: 'partial work' }]);
  });
});
