import type { ChargeRequest, ChargeResult, PaymentProvider } from '@namintoia/naminto-core';

/**
 * Placeholder PaymentProvider: Billing System is out of MVP scope
 * (DECISIONS.md D-2), but the interface exists so nothing couples to a
 * payment vendor directly before it's actually built (DECISIONS.md D-6).
 */
export class StubPaymentProvider implements PaymentProvider {
  readonly name = 'stub';

  async charge(_request: ChargeRequest): Promise<ChargeResult> {
    throw new Error(
      'StubPaymentProvider: no payment vendor is configured yet — Billing System is out of MVP scope.',
    );
  }
}
