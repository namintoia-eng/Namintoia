import type {
  AgentRole,
  AgentTask,
  FeatureSpec,
  IntelligenceProvider,
  Plan,
  ReasoningEngine,
} from '@namintoia/naminto-core';

const SYSTEM_PROMPT = `You are the Reasoning Engine of Naminto IA. Given a user's
natural-language intent, fill in steps 1-5 of the WORKFLOW.md template (OBJECTIF,
EXIGENCES, ARCHITECTURE, COMPOSANTS, INTERFACES) and break the work into an ordered
list of agent tasks. Respond with ONLY a single JSON object matching this exact
shape — no prose, no markdown fences:

{
  "spec": {
    "objective": string,
    "requirements": { "functional": string[], "nonFunctional": string[], "constraints": string[] },
    "architecture": { "modulesInvolved": string[], "newInterfaces": string[] },
    "components": string[],
    "interfaces": string[]
  },
  "tasks": [ { "agentRole": "coding" | "testing" | "debug", "instruction": string } ]
}`;

/** Default ReasoningEngine: delegates the WORKFLOW.md steps 1-5 to an IntelligenceProvider. */
export class IntelligenceReasoningEngine implements ReasoningEngine {
  constructor(private readonly intelligence: IntelligenceProvider) {}

  async planFromIntent(intent: string): Promise<Plan> {
    const result = await this.intelligence.generate({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: intent },
      ],
    });

    const { spec, tasks } = parsePlanResponse(result.content);

    return { intent, spec, tasks };
  }
}

function parsePlanResponse(raw: string): { spec: FeatureSpec; tasks: AgentTask[] } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('IntelligenceReasoningEngine: model response was not valid JSON.');
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('IntelligenceReasoningEngine: model response was not a JSON object.');
  }

  const { spec, tasks } = parsed as Record<string, unknown>;
  assertFeatureSpec(spec);
  assertAgentTasks(tasks);

  return { spec, tasks };
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function assertFeatureSpec(value: unknown): asserts value is FeatureSpec {
  if (typeof value !== 'object' || value === null) {
    throw new Error('IntelligenceReasoningEngine: "spec" is missing or not an object.');
  }
  const spec = value as Record<string, unknown>;

  if (typeof spec['objective'] !== 'string' || spec['objective'].length === 0) {
    throw new Error('IntelligenceReasoningEngine: "spec.objective" must be a non-empty string.');
  }

  const requirements = spec['requirements'];
  if (typeof requirements !== 'object' || requirements === null) {
    throw new Error(
      'IntelligenceReasoningEngine: "spec.requirements" is missing or not an object.',
    );
  }
  const req = requirements as Record<string, unknown>;
  if (
    !isStringArray(req['functional']) ||
    !isStringArray(req['nonFunctional']) ||
    !isStringArray(req['constraints'])
  ) {
    throw new Error(
      'IntelligenceReasoningEngine: "spec.requirements.functional/nonFunctional/constraints" must be string arrays.',
    );
  }

  const architecture = spec['architecture'];
  if (typeof architecture !== 'object' || architecture === null) {
    throw new Error(
      'IntelligenceReasoningEngine: "spec.architecture" is missing or not an object.',
    );
  }
  const arch = architecture as Record<string, unknown>;
  if (!isStringArray(arch['modulesInvolved']) || !isStringArray(arch['newInterfaces'])) {
    throw new Error(
      'IntelligenceReasoningEngine: "spec.architecture.modulesInvolved/newInterfaces" must be string arrays.',
    );
  }

  if (!isStringArray(spec['components'])) {
    throw new Error('IntelligenceReasoningEngine: "spec.components" must be a string array.');
  }
  if (!isStringArray(spec['interfaces'])) {
    throw new Error('IntelligenceReasoningEngine: "spec.interfaces" must be a string array.');
  }
}

const VALID_AGENT_ROLES: readonly AgentRole[] = ['coding', 'testing', 'debug'];

function assertAgentTasks(value: unknown): asserts value is AgentTask[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error('IntelligenceReasoningEngine: "tasks" must be a non-empty array.');
  }
  for (const [index, task] of value.entries()) {
    if (typeof task !== 'object' || task === null) {
      throw new Error(`IntelligenceReasoningEngine: "tasks[${index}]" is not an object.`);
    }
    const t = task as Record<string, unknown>;
    if (!VALID_AGENT_ROLES.includes(t['agentRole'] as AgentRole)) {
      throw new Error(
        `IntelligenceReasoningEngine: "tasks[${index}].agentRole" must be one of ${VALID_AGENT_ROLES.join(', ')}.`,
      );
    }
    if (typeof t['instruction'] !== 'string' || t['instruction'].length === 0) {
      throw new Error(
        `IntelligenceReasoningEngine: "tasks[${index}].instruction" must be a non-empty string.`,
      );
    }
  }
}
