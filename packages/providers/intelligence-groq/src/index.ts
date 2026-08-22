import type {
  IntelligenceProvider,
  ReasoningRequest,
  ReasoningResult,
} from '@namintoia/naminto-core';

export interface GroqIntelligenceProviderConfig {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

interface GroqChatCompletionResponse {
  choices: { message: { content: string | null }; finish_reason: string }[];
  usage: { prompt_tokens: number; completion_tokens: number };
}

/**
 * Default IntelligenceProvider adapter (DECISIONS.md D-23). Groq's API is
 * OpenAI-compatible (same request/response shape), so this mirrors
 * @namintoia/intelligence-openai almost exactly — a separate, duplicated
 * implementation rather than a shared base class, same convention already
 * used between intelligence-anthropic and intelligence-openai.
 */
export class GroqIntelligenceProvider implements IntelligenceProvider {
  readonly name = 'groq';

  private readonly apiKey: string | undefined;
  private readonly model: string;
  private readonly baseUrl: string;

  constructor(config: GroqIntelligenceProviderConfig = {}) {
    this.apiKey = config.apiKey ?? process.env['GROQ_API_KEY'];
    this.model = config.model ?? 'llama-3.3-70b-versatile';
    this.baseUrl = config.baseUrl ?? 'https://api.groq.com/openai/v1/chat/completions';
  }

  async generate(request: ReasoningRequest): Promise<ReasoningResult> {
    if (!this.apiKey) {
      throw new Error(
        'GroqIntelligenceProvider: GROQ_API_KEY is not configured (see .env.example).',
      );
    }

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: request.maxOutputTokens ?? 1024,
        temperature: request.temperature,
        messages: request.messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      }),
    });

    if (!response.ok) {
      throw new Error(`GroqIntelligenceProvider: request failed with status ${response.status}`);
    }

    const data = (await response.json()) as GroqChatCompletionResponse;
    const choice = data.choices[0];

    return {
      content: choice?.message.content ?? '',
      usage: {
        inputTokens: data.usage.prompt_tokens,
        outputTokens: data.usage.completion_tokens,
      },
      stopReason: choice?.finish_reason === 'length' ? 'max_tokens' : 'completed',
    };
  }
}
