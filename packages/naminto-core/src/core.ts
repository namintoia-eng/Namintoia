import type { BackendProvider } from './providers/backend-provider.js';
import type { IntelligenceProvider } from './providers/intelligence-provider.js';
import type { PaymentProvider } from './providers/payment-provider.js';
import type { SandboxProvider } from './providers/sandbox-provider.js';

export interface NamintoCoreProviders {
  sandbox: SandboxProvider;
  backend: BackendProvider;
  intelligence: IntelligenceProvider;
  payment: PaymentProvider;
}

/**
 * Coordination skeleton: every module downstream reaches a vendor only
 * through these four injected providers, never through a direct import
 * (RULES.md — no hard-wired external dependency in Naminto Core).
 */
export class NamintoCore {
  constructor(private readonly providers: NamintoCoreProviders) {}

  get sandbox(): SandboxProvider {
    return this.providers.sandbox;
  }

  get backend(): BackendProvider {
    return this.providers.backend;
  }

  get intelligence(): IntelligenceProvider {
    return this.providers.intelligence;
  }

  get payment(): PaymentProvider {
    return this.providers.payment;
  }
}
