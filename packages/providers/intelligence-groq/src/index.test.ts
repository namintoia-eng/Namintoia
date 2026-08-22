import { afterEach, describe, expect, it, vi } from 'vitest';
import { GroqIntelligenceProvider } from './index.js';

describe('GroqIntelligenceProvider', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('throws a clear configuration error when no API key is set', async () => {
    const provider = new GroqIntelligenceProvider({ apiKey: undefined });
    await expect(provider.generate({ messages: [{ role: 'user', content: 'hi' }] })).rejects.toThrow(
      /GROQ_API_KEY/,
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

    const provider = new GroqIntelligenceProvider({ apiKey: 'test-key' });
    const result = await provider.generate({ messages: [{ role: 'user', content: 'hi' }] });

    expect(result).toEqual({
      content: 'hello back',
      usage: { inputTokens: 3, outputTokens: 5 },
      stopReason: 'completed',
    });
  });

  it('maps finish_reason "length" to stopReason "max_tokens"', async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          choices: [{ message: { content: 'truncated' }, finish_reason: 'length' }],
          usage: { prompt_tokens: 3, completion_tokens: 1024 },
        }),
        { status: 200 },
      ),
    ) as unknown as typeof fetch;

    const provider = new GroqIntelligenceProvider({ apiKey: 'test-key' });
    const result = await provider.generate({ messages: [{ role: 'user', content: 'hi' }] });

    expect(result.stopReason).toBe('max_tokens');
  });

  it('throws a clear error when the request fails', async () => {
    globalThis.fetch = vi.fn(async () => new Response(null, { status: 500 })) as unknown as typeof fetch;

    const provider = new GroqIntelligenceProvider({ apiKey: 'test-key' });

    await expect(provider.generate({ messages: [{ role: 'user', content: 'hi' }] })).rejects.toThrow(
      /request failed with status 500/,
    );
  });
});
