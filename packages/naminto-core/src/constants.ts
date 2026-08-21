/**
 * Working directory every ShellScriptAgent-based agent operates in inside
 * the shared SandboxSession, and where the Agent Orchestrator captures
 * files from at the end of a Plan run (DECISIONS.md D-12). A single shared
 * constant so the agents that write files and the orchestrator that reads
 * them back can never disagree on where "the project" lives.
 */
export const PROJECT_WORKING_DIRECTORY = '/home/user/project';
