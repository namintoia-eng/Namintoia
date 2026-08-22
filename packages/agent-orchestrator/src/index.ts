import type {
  Agent,
  AgentOrchestrator,
  AgentRole,
  AgentTask,
  AgentTaskResult,
  FileSystem,
  OrchestrationResult,
  Plan,
  ProjectFile,
  SandboxProvider,
  SandboxSession,
  TaskProgressEvent,
} from '@namintoia/naminto-core';
import { PROJECT_WORKING_DIRECTORY } from '@namintoia/naminto-core';

const DEFAULT_MAX_DEBUG_ATTEMPTS = 3;

export interface SequentialAgentOrchestratorOptions {
  /** Bounded retry loop cap (debug-agent.md: 3 attempts, then stop and surface the failure). */
  maxDebugAttempts?: number;
}

/**
 * Default AgentOrchestrator: runs a Plan's tasks strictly in order, one
 * agent at a time (DECISIONS.md D-2 — sequential only, not parallel, for
 * the MVP). Owns a single SandboxSession for the whole Plan run
 * (DECISIONS.md D-11) — every task shares the same file tree instead of
 * each starting from an empty sandbox. Before closing that session (success,
 * failure, or a thrown error), captures whatever ended up in
 * PROJECT_WORKING_DIRECTORY into the FileSystem (DECISIONS.md D-12) — the
 * sandbox itself is about to be destroyed, so this is the only chance to
 * keep the files. When a task fails and a 'debug' agent is registered,
 * hands the failure to it for a bounded number of retry attempts
 * (debug-agent.md) instead of giving up immediately or looping forever;
 * still stops and surfaces the full attempt history if the debug agent
 * can't fix it either. With no 'debug' agent registered, behavior is
 * unchanged: stop at the first failure.
 */
export class SequentialAgentOrchestrator implements AgentOrchestrator {
  private readonly maxDebugAttempts: number;

  constructor(
    private readonly agents: Map<AgentRole, Agent>,
    private readonly sandbox: SandboxProvider,
    private readonly fileSystem: FileSystem,
    options: SequentialAgentOrchestratorOptions = {},
  ) {
    this.maxDebugAttempts = options.maxDebugAttempts ?? DEFAULT_MAX_DEBUG_ATTEMPTS;
  }

  async run(
    plan: Plan,
    projectId: string,
    onTaskEvent?: (event: TaskProgressEvent) => void,
  ): Promise<OrchestrationResult> {
    const session = await this.sandbox.createSession(projectId);

    try {
      const results: AgentTaskResult[] = [];

      for (const task of plan.tasks) {
        const agent = this.requireAgent(task.agentRole);
        onTaskEvent?.({ type: 'task_start', role: task.agentRole, instruction: task.instruction });
        let result = await agent.run(task, {
          sandboxSession: session,
          onOutput: (data) => onTaskEvent?.({ type: 'task_output', role: task.agentRole, data }),
        });
        onTaskEvent?.({
          type: 'task_complete',
          role: result.role,
          success: result.success,
          output: result.output,
        });
        results.push(result);

        if (!result.success) {
          const debugAgent = this.agents.get('debug');
          if (debugAgent) {
            result = await this.retryWithDebugAgent(debugAgent, task, result, results, session, onTaskEvent);
          }
        }

        if (!result.success) {
          return { plan, results, success: false };
        }
      }

      return { plan, results, success: true };
    } finally {
      try {
        await this.captureFiles(session, projectId);
      } finally {
        await session.close();
      }
    }
  }

  private requireAgent(role: AgentRole): Agent {
    const agent = this.agents.get(role);
    if (!agent) {
      throw new Error(`SequentialAgentOrchestrator: no agent registered for role "${role}".`);
    }
    return agent;
  }

  private async retryWithDebugAgent(
    debugAgent: Agent,
    originalTask: AgentTask,
    initialFailure: AgentTaskResult,
    results: AgentTaskResult[],
    session: SandboxSession,
    onTaskEvent?: (event: TaskProgressEvent) => void,
  ): Promise<AgentTaskResult> {
    let latest = initialFailure;

    for (let attempt = 1; attempt <= this.maxDebugAttempts; attempt++) {
      const debugTask: AgentTask = {
        agentRole: 'debug',
        instruction: buildDebugInstruction(originalTask, latest, attempt, this.maxDebugAttempts),
      };

      onTaskEvent?.({ type: 'task_start', role: debugTask.agentRole, instruction: debugTask.instruction });
      const debugResult = await debugAgent.run(debugTask, {
        sandboxSession: session,
        onOutput: (data) => onTaskEvent?.({ type: 'task_output', role: debugTask.agentRole, data }),
      });
      onTaskEvent?.({
        type: 'task_complete',
        role: debugResult.role,
        success: debugResult.success,
        output: debugResult.output,
      });
      results.push(debugResult);
      latest = debugResult;

      if (debugResult.success) {
        return debugResult;
      }
    }

    return latest;
  }

  private async captureFiles(session: SandboxSession, projectId: string): Promise<void> {
    const entries = await session.listFiles(PROJECT_WORKING_DIRECTORY);
    const files: ProjectFile[] = [];

    for (const entry of entries) {
      if (entry.type !== 'file') {
        continue;
      }
      const content = await session.readFile(entry.path);
      files.push({ path: toProjectRelativePath(entry.path), content });
    }

    await this.fileSystem.saveProjectFiles(projectId, files);
  }
}

function toProjectRelativePath(absolutePath: string): string {
  const prefix = `${PROJECT_WORKING_DIRECTORY}/`;
  return absolutePath.startsWith(prefix) ? absolutePath.slice(prefix.length) : absolutePath;
}

function buildDebugInstruction(
  task: AgentTask,
  failure: AgentTaskResult,
  attempt: number,
  maxAttempts: number,
): string {
  return [
    `A "${task.agentRole}" task failed (debug attempt ${attempt}/${maxAttempts}).`,
    `Original instruction: ${task.instruction}`,
    `Failure output: ${failure.output}`,
    'Diagnose the root cause and provide a corrected fix that makes the original goal succeed.',
  ].join('\n');
}
