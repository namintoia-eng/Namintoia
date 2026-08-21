import type {
  IntelligenceProvider,
  ReasoningRequest,
  ReasoningResult,
} from '@namintoia/naminto-core';

export interface OpenAiIntelligenceProviderConfig {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

interface OpenAiChatCompletionResponse {
  choices: { message: { content: string | null }; finish_reason: string }[];
  usage: { prompt_tokens: number; completion_tokens: number };
}

/** Second IntelligenceProvider adapter, implemented in parallel with the first (DECISIONS.md D-5). */
export class OpenAiIntelligenceProvider implements IntelligenceProvider {
  readonly name = 'openai';

  private readonly apiKey: string | undefined;
  private readonly model: string;
  private readonly baseUrl: string;

  constructor(config: OpenAiIntelligenceProviderConfig = {}) {
    this.apiKey = config.apiKey ?? process.env['OPENAI_API_KEY'];
    this.model = config.model ?? 'gpt-4.1';
    this.baseUrl = config.baseUrl ?? 'https://api.openai.com/v1/chat/completions';
  }

  async generate(request: ReasoningRequest): Promise<ReasoningResult> {
    if (!this.apiKey) {
      throw new Error(
        'OpenAiIntelligenceProvider: OPENAI_API_KEY is not configured (see .env.example).',
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
      throw new Error(`OpenAiIntelligenceProvider: request failed with status ${response.status}`);
    }

    const data = (await response.json()) as OpenAiChatCompletionResponse;
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
