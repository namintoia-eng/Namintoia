import { Module } from '@nestjs/common';
import { NamintoCore } from '@namintoia/naminto-core';
import { AnthropicIntelligenceProvider } from '@namintoia/intelligence-anthropic';
import { SelfHostedBackendProvider } from '@namintoia/backend-selfhosted';
import { StubSandboxProvider } from '@namintoia/sandbox-stub';
import { StubPaymentProvider } from '@namintoia/payment-stub';

export const NAMINTO_CORE = Symbol('NAMINTO_CORE');

// Anthropic is the default IntelligenceProvider (DECISIONS.md D-5); the
// second adaptor (@namintoia/intelligence-openai) is available and tested
// the same way, just not wired as the default here yet.
@Module({
  providers: [
    {
      provide: NAMINTO_CORE,
      useFactory: () =>
        new NamintoCore({
          intelligence: new AnthropicIntelligenceProvider(),
          sandbox: new StubSandboxProvider(),
          backend: new SelfHostedBackendProvider(),
          payment: new StubPaymentProvider(),
        }),
    },
  ],
  exports: [NAMINTO_CORE],
})
export class NamintoCoreModule {}
