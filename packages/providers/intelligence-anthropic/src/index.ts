import type {
  IntelligenceProvider,
  ReasoningRequest,
  ReasoningResult,
} from '@namintoia/naminto-core';

export interface AnthropicIntelligenceProviderConfig {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

interface AnthropicMessagesResponse {
  content: { type: string; text?: string }[];
  usage: { input_tokens: number; output_tokens: number };
  stop_reason: string;
}

/** Default IntelligenceProvider adapter (DECISIONS.md D-5). */
export class AnthropicIntelligenceProvider implements IntelligenceProvider {
  readonly name = 'anthropic';

  private readonly apiKey: string | undefined;
  private readonly model: string;
  private readonly baseUrl: string;

  constructor(config: AnthropicIntelligenceProviderConfig = {}) {
    this.apiKey = config.apiKey ?? process.env['ANTHROPIC_API_KEY'];
    this.model = config.model ?? 'claude-sonnet-5';
    this.baseUrl = config.baseUrl ?? 'https://api.anthropic.com/v1/messages';
  }

  async generate(request: ReasoningRequest): Promise<ReasoningResult> {
    if (!this.apiKey) {
      throw new Error(
        'AnthropicIntelligenceProvider: ANTHROPIC_API_KEY is not configured (see .env.example).',
      );
    }

    const system = request.messages
      .filter((message) => message.role === 'system')
      .map((message) => message.content)
      .join('\n');
    const conversation = request.messages.filter((message) => message.role !== 'system');

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        system: system || undefined,
        max_tokens: request.maxOutputTokens ?? 1024,
        temperature: request.temperature,
        messages: conversation.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      }),
    });

    if (!response.ok) {
      throw new Error(
        `AnthropicIntelligenceProvider: request failed with status ${response.status}`,
      );
    }

    const data = (await response.json()) as AnthropicMessagesResponse;
    const content = data.content.find((block) => block.type === 'text')?.text ?? '';

    return {
      content,
      usage: {
        inputTokens: data.usage.input_tokens,
        outputTokens: data.usage.output_tokens,
      },
      stopReason: data.stop_reason === 'max_tokens' ? 'max_tokens' : 'completed',
    };
  }
}
