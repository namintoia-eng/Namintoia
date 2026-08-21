import { afterEach, describe, expect, it, vi } from 'vitest';
import { AnthropicIntelligenceProvider } from './index.js';

describe('AnthropicIntelligenceProvider', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.unstubAllEnvs();
  });

  it('throws a clear configuration error when no API key is set', async () => {
    const provider = new AnthropicIntelligenceProvider({ apiKey: undefined });
    await expect(provider.generate({ messages: [{ role: 'user', content: 'hi' }] })).rejects.toThrow(
      /ANTHROPIC_API_KEY/,
    );
  });

  it('maps a successful response into a vendor-neutral ReasoningResult', async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          content: [{ type: 'text', text: 'hello back' }],
          usage: { input_tokens: 3, output_tokens: 5 },
          stop_reason: 'end_turn',
        }),
        { status: 200 },
      ),
    ) as unknown as typeof fetch;

    const provider = new AnthropicIntelligenceProvider({ apiKey: 'test-key' });
    const result = await provider.generate({ messages: [{ role: 'user', content: 'hi' }] });

    expect(result).toEqual({
      content: 'hello back',
      usage: { inputTokens: 3, outputTokens: 5 },
      stopReason: 'completed',
    });
  });
});
