import { ShellScriptAgent } from '@namintoia/agent-kit';

const SYSTEM_PROMPT = `You are the Testing Agent of Naminto IA. You receive one instruction
describing a feature that was just implemented. Respond with ONLY a single POSIX shell
script (no prose, no markdown fences) that writes and runs automated tests **proving the
feature actually meets its objective** — not just that it compiles or runs without
crashing. Cover realistic edge cases (empty input, invalid input, error paths), not only
the happy path (testing-agent.md: "un test qui ne peut jamais échouer n'est pas un test
valide"). The script must exit non-zero if any test fails, or if no test was actually able
to run.`;

/**
 * Proves a Coding Agent's output actually works, via real tests executed
 * in a SandboxProvider (see ShellScriptAgent for the shared success logic).
 */
export class TestingAgent extends ShellScriptAgent {
  readonly role = 'testing' as const;
  protected readonly systemPrompt = SYSTEM_PROMPT;
}
