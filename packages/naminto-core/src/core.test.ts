import { describe, expect, it } from 'vitest';
import { NamintoCore } from './core.js';
import type { BackendProvider } from './providers/backend-provider.js';
import type { IntelligenceProvider } from './providers/intelligence-provider.js';
import type { PaymentProvider } from './providers/payment-provider.js';
import type { SandboxProvider } from './providers/sandbox-provider.js';

const fakeSandbox: SandboxProvider = {
  name: 'fake-sandbox',
  async createSession(projectId: string) {
    return {
      id: `${projectId}-session`,
      async execute() {
        return { exitCode: 0, timedOut: false, durationMs: 1 };
      },
      async close() {},
    };
  },
};

const fakeBackend: BackendProvider = {
  name: 'fake-backend',
  async provisionProjectBackend() {
    return {
      databaseUrl: 'postgres://fake',
      authServiceUrl: 'http://fake-auth',
      storageServiceUrl: 'http://fake-storage',
    };
  },
  async teardownProjectBackend() {},
};

const fakeIntelligence: IntelligenceProvider = {
  name: 'fake-intelligence',
  async generate() {
    return {
      content: 'ok',
      usage: { inputTokens: 1, outputTokens: 1 },
      stopReason: 'completed',
    };
  },
};

const fakePayment: PaymentProvider = {
  name: 'fake-payment',
  async charge() {
    return { chargeId: 'ch_fake', status: 'succeeded' };
  },
};

describe('NamintoCore', () => {
  it('exposes each provider it was constructed with, unchanged', () => {
    const core = new NamintoCore({
      sandbox: fakeSandbox,
      backend: fakeBackend,
      intelligence: fakeIntelligence,
      payment: fakePayment,
    });

    expect(core.sandbox).toBe(fakeSandbox);
    expect(core.backend).toBe(fakeBackend);
    expect(core.intelligence).toBe(fakeIntelligence);
    expect(core.payment).toBe(fakePayment);
  });

  it('delegates provider calls without altering their results', async () => {
    const core = new NamintoCore({
      sandbox: fakeSandbox,
      backend: fakeBackend,
      intelligence: fakeIntelligence,
      payment: fakePayment,
    });

    const result = await core.intelligence.generate({ messages: [{ role: 'user', content: 'hi' }] });
    expect(result.content).toBe('ok');

    const charge = await core.payment.charge({
      customerId: 'cus_1',
      amountCents: 100,
      currency: 'usd',
      description: 'test',
    });
    expect(charge.status).toBe('succeeded');
  });
});
