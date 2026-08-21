import { describe, expect, it } from 'vitest';
import { StubPaymentProvider } from './index.js';

describe('StubPaymentProvider', () => {
  it('refuses to charge instead of pretending to succeed', async () => {
    const provider = new StubPaymentProvider();
    await expect(
      provider.charge({ customerId: 'c1', amountCents: 100, currency: 'usd', description: 'x' }),
    ).rejects.toThrow(/no payment vendor/);
  });
});
