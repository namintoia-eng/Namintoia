import { afterEach, describe, expect, it, vi } from 'vitest';
import { OpenAiIntelligenceProvider } from './index.js';

describe('OpenAiIntelligenceProvider', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('throws a clear configuration error when no API key is set', async () => {
    const provider = new OpenAiIntelligenceProvider({ apiKey: undefined });
    await expect(provider.generate({ messages: [{ role: 'user', content: 'hi' }] })).rejects.toThrow(
      /OPENAI_API_KEY/,
    );
  });

  it('maps a successful response into a vendor-neutral ReasoningResult', async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          choices: [{ message: { content: 'hello back' }, finish_reason: 'stop' }],
          usage: { prompt_tokens: 3, completion_tokens: 5 },
        }),
        { status: 200 },
      ),
    ) as unknown as typeof fetch;

    const provider = new OpenAiIntelligenceProvider({ apiKey: 'test-key' });
    const result = await provider.generate({ messages: [{ role: 'user', content: 'hi' }] });

    expect(result).toEqual({
      content: 'hello back',
      usage: { inputTokens: 3, outputTokens: 5 },
      stopReason: 'completed',
    });
  });
});
