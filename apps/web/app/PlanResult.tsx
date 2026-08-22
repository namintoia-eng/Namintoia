import type { OrchestrationResult, Plan } from '@namintoia/naminto-core';

interface PlanResultProps {
  plan: Plan;
  result: OrchestrationResult;
}

export default function PlanResult({ plan, result }: PlanResultProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">Plan</h2>
        <p className="mb-3 text-sm text-zinc-200">
          <span className="text-zinc-400">Objectif :</span> {plan.spec.objective}
        </p>
        <ul className="flex flex-col gap-2">
          {plan.tasks.map((task, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-zinc-300">
              <span className="mt-0.5 shrink-0 rounded-full bg-zinc-800 px-2 py-0.5 text-xs uppercase tracking-wide text-zinc-400">
                {task.agentRole}
              </span>
              <span>{task.instruction}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">Résultat</h2>
        <p className="mb-3 text-sm text-zinc-300">
          Statut :{' '}
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              result.success ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
            }`}
          >
            {result.success ? 'Succès' : 'Échec'}
          </span>
        </p>
        <div className="flex flex-col gap-2">
          {result.results.map((taskResult, index) => (
            <pre
              key={index}
              className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-xs text-zinc-300"
            >
              [{taskResult.role}] {taskResult.success ? 'OK' : 'ÉCHEC'}
              {'\n'}
              {taskResult.output}
            </pre>
          ))}
        </div>
      </div>
    </div>
  );
}
