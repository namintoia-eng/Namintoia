import type { OrchestrationResult } from './agent.js';
import type { Plan } from './reasoning.js';

export interface ConversationTurn {
  id: string;
  projectId: string;
  intent: string;
  plan: Plan;
  result: OrchestrationResult;
  createdAt: string;
}

export type NewConversationTurn = Omit<ConversationTurn, 'id' | 'createdAt'>;

/**
 * Persists project context between requests/sessions — the application-side
 * equivalent of naminto-ops/STATE.md + DECISIONS.md for this project's own
 * vibecoding process (GLOSSARY.md). MVP scope (DECISIONS.md D-2): simple
 * persistence, no semantic search yet.
 */
export interface MemoryStore {
  readonly name: string;
  saveTurn(turn: NewConversationTurn): Promise<ConversationTurn>;
  listTurns(projectId: string): Promise<ConversationTurn[]>;
  deleteProject(projectId: string): Promise<void>;
}
