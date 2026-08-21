import { Module } from '@nestjs/common';
import { NamintoCore } from '@namintoia/naminto-core';
import type { Agent, AgentRole } from '@namintoia/naminto-core';
import { AnthropicIntelligenceProvider } from '@namintoia/intelligence-anthropic';
import { SelfHostedBackendProvider } from '@namintoia/backend-selfhosted';
import { E2bSandboxProvider } from '@namintoia/sandbox-e2b';
import { StubPaymentProvider } from '@namintoia/payment-stub';
import { IntelligenceReasoningEngine } from '@namintoia/reasoning-engine';
import { SequentialAgentOrchestrator } from '@namintoia/agent-orchestrator';
import { CodingAgent } from '@namintoia/coding-agent';
import { TestingAgent } from '@namintoia/testing-agent';
import { DebugAgent } from '@namintoia/debug-agent';
import { FileMemoryStore } from '@namintoia/memory-system';
import { LocalFileSystem } from '@namintoia/file-system';
import { LocalUserSystem } from '@namintoia/user-system';
import { LocalProjectSystem } from '@namintoia/project-system';

export const NAMINTO_CORE = Symbol('NAMINTO_CORE');
export const REASONING_ENGINE = Symbol('REASONING_ENGINE');
export const AGENT_ORCHESTRATOR = Symbol('AGENT_ORCHESTRATOR');
export const MEMORY_STORE = Symbol('MEMORY_STORE');
export const FILE_SYSTEM = Symbol('FILE_SYSTEM');
export const USER_SYSTEM = Symbol('USER_SYSTEM');
export const PROJECT_SYSTEM = Symbol('PROJECT_SYSTEM');

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
      provide: FILE_SYSTEM,
      useFactory: () => new LocalFileSystem(),
    },
    {
      provide: AGENT_ORCHESTRATOR,
      inject: [NAMINTO_CORE, FILE_SYSTEM],
      useFactory: (core: NamintoCore, fileSystem: LocalFileSystem) =>
        new SequentialAgentOrchestrator(
          new Map<AgentRole, Agent>([
            ['coding', new CodingAgent(core.intelligence)],
            ['testing', new TestingAgent(core.intelligence)],
            ['debug', new DebugAgent(core.intelligence)],
          ]),
          core.sandbox,
          fileSystem,
        ),
    },
    {
      provide: MEMORY_STORE,
      useFactory: () => new FileMemoryStore(),
    },
    {
      provide: USER_SYSTEM,
      useFactory: () => new LocalUserSystem(),
    },
    {
      provide: PROJECT_SYSTEM,
      useFactory: () => new LocalProjectSystem(),
    },
  ],
  exports: [
    NAMINTO_CORE,
    REASONING_ENGINE,
    AGENT_ORCHESTRATOR,
    MEMORY_STORE,
    FILE_SYSTEM,
    USER_SYSTEM,
    PROJECT_SYSTEM,
  ],
})
export class NamintoCoreModule {}
