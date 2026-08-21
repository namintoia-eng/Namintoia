import { randomUUID } from 'node:crypto';
import type {
  Agent,
  AgentTask,
  AgentTaskResult,
  IntelligenceProvider,
  SandboxOutputChunk,
  SandboxProvider,
} from '@namintoia/naminto-core';

const SYSTEM_PROMPT = `You are the Coding Agent of Naminto IA. You receive one instruction
derived from a validated Plan (WORKFLOW.md steps 1-5 already done — do not re-plan, just
implement). Respond with ONLY a single POSIX shell script that carries out the instruction
in the current working directory — no prose, no markdown fences, no explanation. The script
must exit with a non-zero status if the instruction could not be completed, and should run
whatever build/test command is appropriate to prove the result actually works rather than
just writing files and stopping.`;

const DEFAULT_TIMEOUT_MS = 120_000;

/**
 * Transforms a validated AgentTask into a shell script (via an
 * IntelligenceProvider) and runs it inside a SandboxProvider. Success is
 * decided by the sandbox's exit code, never by the model's own claim that
 * it's done — "the model says it's done" is not proof (NAMINTO.md AI Engine
 * principle, coding-agent.md Definition of Done).
 */
export class CodingAgent implements Agent {
  readonly role = 'coding' as const;

  constructor(
    private readonly intelligence: IntelligenceProvider,
    private readonly sandbox: SandboxProvider,
  ) {}

  async run(task: AgentTask): Promise<AgentTaskResult> {
    const generated = await this.intelligence.generate({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: task.instruction },
      ],
    });

    const script = generated.content.trim();
    if (script.length === 0) {
      throw new Error('CodingAgent: model returned an empty script for this task.');
    }

    const output: string[] = [];
    const onOutput = (chunk: SandboxOutputChunk): void => {
      if (chunk.stream === 'stdout' || chunk.stream === 'stderr') {
        output.push(chunk.data);
      }
    };

    const result = await this.sandbox.execute(
      {
        projectId: `coding-agent-${randomUUID()}`,
        command: 'sh',
        args: ['-c', script],
        limits: { maxWallClockMs: DEFAULT_TIMEOUT_MS },
      },
      onOutput,
    );

    const success = !result.timedOut && result.exitCode === 0;

    return {
      role: 'coding',
      success,
      output: success
        ? output.join('')
        : `${output.join('')}\n[CodingAgent] failed: exitCode=${result.exitCode}, timedOut=${result.timedOut}`,
    };
  }
}
