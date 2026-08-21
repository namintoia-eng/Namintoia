export interface ReasoningMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ReasoningRequest {
  messages: ReasoningMessage[];
  maxOutputTokens?: number;
  temperature?: number;
}

export interface ReasoningUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface ReasoningResult {
  content: string;
  usage: ReasoningUsage;
  stopReason: 'completed' | 'max_tokens' | 'stopped_by_provider';
}

/**
 * Reasoning/generation contract. Types are intentionally vendor-neutral
 * (e.g. ReasoningResult, not ClaudeResponse) — RULES.md forbids exposing a
 * provider's identity through Naminto Core's public API.
 */
export interface IntelligenceProvider {
  readonly name: string;
  generate(request: ReasoningRequest): Promise<ReasoningResult>;
}
