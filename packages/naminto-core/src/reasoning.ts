export interface FeatureSpec {
  objective: string;
  requirements: {
    functional: string[];
    nonFunctional: string[];
    constraints: string[];
  };
  architecture: {
    modulesInvolved: string[];
    newInterfaces: string[];
  };
  components: string[];
  interfaces: string[];
}

export type AgentRole = 'coding' | 'testing' | 'debug';

export interface AgentTask {
  agentRole: AgentRole;
  instruction: string;
}

export interface Plan {
  intent: string;
  spec: FeatureSpec;
  tasks: AgentTask[];
}

/**
 * Turns a natural-language intent into an actionable Plan by applying
 * WORKFLOW.md steps 1-5 (OBJECTIF..INTERFACES). Steps 6-8
 * (IMPLÉMENTATION/TESTS/VALIDATION) are the agents' job, not this engine's.
 */
export interface ReasoningEngine {
  planFromIntent(intent: string): Promise<Plan>;
}
