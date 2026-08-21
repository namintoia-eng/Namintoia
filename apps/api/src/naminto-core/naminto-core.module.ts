import { Module } from '@nestjs/common';
import { NamintoCore } from '@namintoia/naminto-core';
import { AnthropicIntelligenceProvider } from '@namintoia/intelligence-anthropic';
import { SelfHostedBackendProvider } from '@namintoia/backend-selfhosted';
import { E2bSandboxProvider } from '@namintoia/sandbox-e2b';
import { StubPaymentProvider } from '@namintoia/payment-stub';
import { IntelligenceReasoningEngine } from '@namintoia/reasoning-engine';
import { SequentialAgentOrchestrator } from '@namintoia/agent-orchestrator';
import { CodingAgent } from '@namintoia/coding-agent';

export const NAMINTO_CORE = Symbol('NAMINTO_CORE');
export const REASONING_ENGINE = Symbol('REASONING_ENGINE');
export const AGENT_ORCHESTRATOR = Symbol('AGENT_ORCHESTRATOR');

// Anthropic is the default IntelligenceProvider (DECISIONS.md D-5); the
// second adaptor (@namintoia/intelligence-openai) is available and tested
// the same way, just not wired as the default here yet. E2B is the default
// SandboxProvider (DECISIONS.md D-8) — without E2B_API_KEY/ANTHROPIC_API_KEY
// configured, the underlying providers throw a clear error on first use
// rather than silently doing nothing.
//
// ReasoningEngine and AgentOrchestrator are derived from the same
// NamintoCore providers rather than constructing their own — one
// IntelligenceProvider/SandboxProvider instance per process, not one per
// consumer.
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
    {
      provide: REASONING_ENGINE,
      inject: [NAMINTO_CORE],
      useFactory: (core: NamintoCore) => new IntelligenceReasoningEngine(core.intelligence),
    },
    {
      provide: AGENT_ORCHESTRATOR,
      inject: [NAMINTO_CORE],
      useFactory: (core: NamintoCore) =>
        new SequentialAgentOrchestrator(
          new Map([['coding', new CodingAgent(core.intelligence, core.sandbox)]]),
        ),
    },
  ],
  exports: [NAMINTO_CORE, REASONING_ENGINE, AGENT_ORCHESTRATOR],
})
export class NamintoCoreModule {}
