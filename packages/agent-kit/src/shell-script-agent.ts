import type {
  Agent,
  AgentRole,
  AgentRunContext,
  AgentTask,
  AgentTaskResult,
  IntelligenceProvider,
  SandboxOutputChunk,
} from '@namintoia/naminto-core';
import { PROJECT_WORKING_DIRECTORY } from '@namintoia/naminto-core';

const DEFAULT_TIMEOUT_MS = 120_000;

/**
 * Shared behavior for every agent that turns an instruction into a shell
 * script (via an IntelligenceProvider) and proves it worked by actually
 * running it in the Plan's shared SandboxSession (AgentRunContext). Success
 * is decided strictly by the sandbox's exit code and timedOut flag — never
 * by the model's own claims — matching NAMINTO.md's "the model says it's
 * done is never proof of success" rule. Coding, Testing, and Debug agents
 * all follow this same shape; only the role and system prompt differ
 * (naminto-ops/RULES.md: Naminto Core itself must not grow with
 * agent-specific logic, so this lives in its own package rather than in
 * @namintoia/naminto-core).
 */
export abstract class ShellScriptAgent implements Agent {
  abstract readonly role: AgentRole;
  protected abstract readonly systemPrompt: string;
  protected readonly timeoutMs: number = DEFAULT_TIMEOUT_MS;

  constructor(protected readonly intelligence: IntelligenceProvider) {}

  async run(task: AgentTask, context: AgentRunContext): Promise<AgentTaskResult> {
    const generated = await this.intelligence.generate({
      messages: [
        { role: 'system', content: this.systemPrompt },
        { role: 'user', content: task.instruction },
      ],
    });

    const script = generated.content.trim();
    if (script.length === 0) {
      throw new Error(`${this.role} agent: model returned an empty script for this task.`);
    }

    // Every agent shares one project directory across the whole Plan run
    // (PROJECT_WORKING_DIRECTORY) so the Agent Orchestrator can capture a
    // consistent file tree afterward (DECISIONS.md D-12) — ensure it exists
    // before running a script that assumes it (mkdir -p is a no-op if it's
    // already there from an earlier task in the same session).
    await context.sandboxSession.execute({
      command: 'mkdir',
      args: ['-p', PROJECT_WORKING_DIRECTORY],
    });

    const output: string[] = [];
    const onOutput = (chunk: SandboxOutputChunk): void => {
      if (chunk.stream === 'stdout' || chunk.stream === 'stderr') {
        output.push(chunk.data);
      }
    };

    const result = await context.sandboxSession.execute(
      {
        command: 'sh',
        args: ['-c', script],
        workingDirectory: PROJECT_WORKING_DIRECTORY,
        limits: { maxWallClockMs: this.timeoutMs },
      },
      onOutput,
    );

    const success = !result.timedOut && result.exitCode === 0;

    return {
      role: this.role,
      success,
      output: success
        ? output.join('')
        : `${output.join('')}\n[${this.role} agent] failed: exitCode=${result.exitCode}, timedOut=${result.timedOut}`,
    };
  }
}
