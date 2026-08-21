import type {
  Agent,
  AgentOrchestrator,
  AgentRole,
  AgentTaskResult,
  OrchestrationResult,
  Plan,
} from '@namintoia/naminto-core';

/**
 * Default AgentOrchestrator: runs a Plan's tasks strictly in order, one
 * agent at a time (DECISIONS.md D-2 — sequential only, not parallel, for
 * the MVP). Stops at the first failed task rather than pressing on into an
 * inconsistent state.
 */
export class SequentialAgentOrchestrator implements AgentOrchestrator {
  constructor(private readonly agents: Map<AgentRole, Agent>) {}

  async run(plan: Plan): Promise<OrchestrationResult> {
    const results: AgentTaskResult[] = [];

    for (const task of plan.tasks) {
      const agent = this.agents.get(task.agentRole);
      if (!agent) {
        throw new Error(
          `SequentialAgentOrchestrator: no agent registered for role "${task.agentRole}".`,
        );
      }

      const result = await agent.run(task);
      results.push(result);

      if (!result.success) {
        return { plan, results, success: false };
      }
    }

    return { plan, results, success: true };
  }
}
