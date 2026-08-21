export interface ChargeRequest {
  customerId: string;
  amountCents: number;
  currency: string;
  description: string;
}

export interface ChargeResult {
  chargeId: string;
  status: 'succeeded' | 'pending' | 'failed';
}

/**
 * Payment/subscription contract. Billing System itself is out of MVP scope
 * (DECISIONS.md D-2) but the interface must exist so nothing couples to a
 * payment vendor directly in the meantime (DECISIONS.md D-6).
 */
export interface PaymentProvider {
  readonly name: string;
  charge(request: ChargeRequest): Promise<ChargeResult>;
}
