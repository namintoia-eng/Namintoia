import { Module } from '@nestjs/common';
import { NamintoCore } from '@namintoia/naminto-core';
import { AnthropicIntelligenceProvider } from '@namintoia/intelligence-anthropic';
import { SelfHostedBackendProvider } from '@namintoia/backend-selfhosted';
import { E2bSandboxProvider } from '@namintoia/sandbox-e2b';
import { StubPaymentProvider } from '@namintoia/payment-stub';

export const NAMINTO_CORE = Symbol('NAMINTO_CORE');

// Anthropic is the default IntelligenceProvider (DECISIONS.md D-5); the
// second adaptor (@namintoia/intelligence-openai) is available and tested
// the same way, just not wired as the default here yet. E2B is the default
// SandboxProvider (DECISIONS.md D-8) — without E2B_API_KEY configured it
// throws a clear error on first use rather than silently doing nothing.
@Module({
  providers: [
    {
      provide: NAMINTO_CORE,
      useFactory: () =>
        new NamintoCore({
          intelligence: new AnthropicIntelligenceProvider(),
          sandbox: new E2bSandboxProvider(),
          backend: new SelfHostedBackendProvider(),
          payment: new StubPaymentProvider(),
        }),
    },
  ],
  exports: [NAMINTO_CORE],
})
export class NamintoCoreModule {}
