import type { AgentRole, AgentTask, Plan } from './reasoning.js';

export interface AgentTaskResult {
  role: AgentRole;
  success: boolean;
  output: string;
}

/** A specialized agent (Coding, Testing, Debug, ...) that can run one AgentTask. */
export interface Agent {
  readonly role: AgentRole;
  run(task: AgentTask): Promise<AgentTaskResult>;
}

export interface OrchestrationResult {
  plan: Plan;
  results: AgentTaskResult[];
  success: boolean;
}

/**
 * Distributes a Plan's tasks across registered agents and sequences their
 * execution — sequential only for the MVP, not parallel (DECISIONS.md D-2).
 */
export interface AgentOrchestrator {
  run(plan: Plan): Promise<OrchestrationResult>;
}
