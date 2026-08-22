import type {
  IntelligenceProvider,
  ReasoningRequest,
  ReasoningResult,
} from '@namintoia/naminto-core';

export interface OllamaIntelligenceProviderConfig {
  baseUrl?: string;
  model?: string;
}

interface OllamaChatResponse {
  message: { content: string };
  done_reason?: string;
  prompt_eval_count?: number;
  eval_count?: number;
}

/**
 * Second IntelligenceProvider adapter (DECISIONS.md D-23) — runs fully
 * local against Ollama's own HTTP API (not its OpenAI-compatibility mode,
 * to avoid assuming that mode is enabled). No API key: Ollama is reached
 * over plain HTTP on the machine it runs on.
 */
export class OllamaIntelligenceProvider implements IntelligenceProvider {
  readonly name = 'ollama';

  private readonly baseUrl: string;
  private readonly model: string;

  constructor(config: OllamaIntelligenceProviderConfig = {}) {
    this.baseUrl = config.baseUrl ?? process.env['OLLAMA_BASE_URL'] ?? 'http://localhost:11434';
    this.model = config.model ?? process.env['OLLAMA_MODEL'] ?? 'llama3.2';
  }

  async generate(request: ReasoningRequest): Promise<ReasoningResult> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          stream: false,
          messages: request.messages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
          options: {
            num_predict: request.maxOutputTokens ?? 1024,
            temperature: request.temperature,
          },
        }),
      });
    } catch (error) {
      throw new Error(
        `OllamaIntelligenceProvider: could not reach Ollama at ${this.baseUrl} — is it running ` +
          `("ollama serve") with the "${this.model}" model pulled ("ollama pull ${this.model}")? ` +
          `(${error instanceof Error ? error.message : String(error)})`,
      );
    }

    if (!response.ok) {
      throw new Error(`OllamaIntelligenceProvider: request failed with status ${response.status}`);
    }

    const data = (await response.json()) as OllamaChatResponse;

    return {
      content: data.message.content,
      usage: {
        inputTokens: data.prompt_eval_count ?? 0,
        outputTokens: data.eval_count ?? 0,
      },
      stopReason: data.done_reason === 'length' ? 'max_tokens' : 'completed',
    };
  }
}
