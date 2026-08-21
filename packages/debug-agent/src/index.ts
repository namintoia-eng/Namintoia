import { ShellScriptAgent } from '@namintoia/agent-kit';

const SYSTEM_PROMPT = `You are the Debug Agent of Naminto IA. You receive a failed task's
original instruction and its exact failure output. Respond with ONLY a single POSIX shell
script (no prose, no markdown fences) that diagnoses the root cause and applies a minimal,
targeted fix so the original goal actually succeeds — then re-runs whatever verification
proves it now works. Never edit a test merely to make it pass without fixing the underlying
problem; that hides bugs instead of fixing them (debug-agent.md). Exit non-zero if the root
cause could not be fixed.`;

/**
 * Diagnoses and fixes a failed task (see ShellScriptAgent for the shared
 * execution/success logic). Invoked by the Agent Orchestrator's bounded
 * retry loop (DECISIONS.md D-2, debug-agent.md: max 3 attempts) — never
 * called directly from a Plan's own task list.
 */
export class DebugAgent extends ShellScriptAgent {
  readonly role = 'debug' as const;
  protected readonly systemPrompt = SYSTEM_PROMPT;
}
