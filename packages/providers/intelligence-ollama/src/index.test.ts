import { afterEach, describe, expect, it, vi } from 'vitest';
import { OllamaIntelligenceProvider } from './index.js';

describe('OllamaIntelligenceProvider', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('maps a successful response into a vendor-neutral ReasoningResult', async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          message: { content: 'hello back' },
          done_reason: 'stop',
          prompt_eval_count: 3,
          eval_count: 5,
        }),
        { status: 200 },
      ),
    ) as unknown as typeof fetch;

    const provider = new OllamaIntelligenceProvider({ baseUrl: 'http://localhost:11434' });
    const result = await provider.generate({ messages: [{ role: 'user', content: 'hi' }] });

    expect(result).toEqual({
      content: 'hello back',
      usage: { inputTokens: 3, outputTokens: 5 },
      stopReason: 'completed',
    });
  });

  it('maps done_reason "length" to stopReason "max_tokens"', async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          message: { content: 'truncated' },
          done_reason: 'length',
          prompt_eval_count: 3,
          eval_count: 1024,
        }),
        { status: 200 },
      ),
    ) as unknown as typeof fetch;

    const provider = new OllamaIntelligenceProvider();
    const result = await provider.generate({ messages: [{ role: 'user', content: 'hi' }] });

    expect(result.stopReason).toBe('max_tokens');
  });

  it('throws a clear, actionable error when Ollama cannot be reached', async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new Error('ECONNREFUSED');
    }) as unknown as typeof fetch;

    const provider = new OllamaIntelligenceProvider({ baseUrl: 'http://localhost:11434', model: 'llama3.2' });

    await expect(provider.generate({ messages: [{ role: 'user', content: 'hi' }] })).rejects.toThrow(
      /could not reach Ollama.*ollama serve.*llama3\.2/s,
    );
  });

  it('throws a clear error when the request fails with a non-2xx status', async () => {
    globalThis.fetch = vi.fn(async () => new Response(null, { status: 500 })) as unknown as typeof fetch;

    const provider = new OllamaIntelligenceProvider();

    await expect(provider.generate({ messages: [{ role: 'user', content: 'hi' }] })).rejects.toThrow(
      /request failed with status 500/,
    );
  });
});
