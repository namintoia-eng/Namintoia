import type { AgentRole, AgentTask, Plan } from './reasoning.js';
import type { SandboxSession } from './providers/sandbox-provider.js';

export interface AgentTaskResult {
  role: AgentRole;
  success: boolean;
  output: string;
}

/**
 * Per-run context an orchestrator hands to every agent invocation. Carries
 * the SandboxSession shared across a whole Plan's tasks, so a testing task
 * sees the files a coding task just wrote instead of an empty sandbox.
 * `onOutput` (DECISIONS.md D-22) lets an agent forward live stdout/stderr
 * text as it runs — optional, so agents that don't produce incremental
 * output (or orchestrators that don't care) are unaffected.
 */
export interface AgentRunContext {
  sandboxSession: SandboxSession;
  onOutput?: (data: string) => void;
}

/** A specialized agent (Coding, Testing, Debug, ...) that can run one AgentTask. */
export interface Agent {
  readonly role: AgentRole;
  run(task: AgentTask, context: AgentRunContext): Promise<AgentTaskResult>;
}

export interface OrchestrationResult {
  plan: Plan;
  results: AgentTaskResult[];
  success: boolean;
}

/**
 * Live progress during a run (DECISIONS.md D-21) — emitted around every
 * individual agent.run() call, including debug-agent retries, which is why
 * there's no index/total here: the debug retry loop (up to 3 attempts,
 * debug-agent.md) makes the total step count unknowable upfront. Consumers
 * append each task_start/task_complete pair in arrival order — the
 * orchestrator is strictly sequential (never concurrent), so "the last
 * entry is the one completing" always holds.
 */
export type TaskProgressEvent =
  | { type: 'task_start'; role: AgentRole; instruction: string }
  | { type: 'task_output'; role: AgentRole; data: string }
  | { type: 'task_complete'; role: AgentRole; success: boolean; output: string };

/**
 * Distributes a Plan's tasks across registered agents and sequences their
 * execution — sequential only for the MVP, not parallel (DECISIONS.md D-2).
 * projectId scopes the shared SandboxSession created for the run.
 */
export interface AgentOrchestrator {
  run(
    plan: Plan,
    projectId: string,
    onTaskEvent?: (event: TaskProgressEvent) => void,
  ): Promise<OrchestrationResult>;
}
