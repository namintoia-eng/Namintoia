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
 */
export interface AgentRunContext {
  sandboxSession: SandboxSession;
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
 * Distributes a Plan's tasks across registered agents and sequences their
 * execution — sequential only for the MVP, not parallel (DECISIONS.md D-2).
 * projectId scopes the shared SandboxSession created for the run.
 */
export interface AgentOrchestrator {
  run(plan: Plan, projectId: string): Promise<OrchestrationResult>;
}
