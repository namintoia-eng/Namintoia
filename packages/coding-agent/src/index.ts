import { ShellScriptAgent } from '@namintoia/agent-kit';

const SYSTEM_PROMPT = `You are the Coding Agent of Naminto IA. You receive one instruction
derived from a validated Plan (WORKFLOW.md steps 1-5 already done — do not re-plan, just
implement). Respond with ONLY a single POSIX shell script that carries out the instruction
in the current working directory — no prose, no markdown fences, no explanation. The script
must exit with a non-zero status if the instruction could not be completed, and should run
whatever build/test command is appropriate to prove the result actually works rather than
just writing files and stopping.`;

/**
 * Transforms a validated AgentTask into a shell script and runs it inside a
 * SandboxProvider (see ShellScriptAgent for the shared execution/success
 * logic — success always follows the sandbox exit code, never the model's
 * own claims).
 */
export class CodingAgent extends ShellScriptAgent {
  readonly role = 'coding' as const;
  protected readonly systemPrompt = SYSTEM_PROMPT;
}
