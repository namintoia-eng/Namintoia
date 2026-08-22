'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import type { OrchestrationResult, Plan } from '@namintoia/naminto-core';

type ViewState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; plan: Plan; result: OrchestrationResult };

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface ChatProps {
  token: string;
  projectId: string;
  projectName: string;
  onBackToProjects: () => void;
  onLogout: () => void;
  onUnauthorized: () => void;
}

export default function Chat({
  token,
  projectId,
  projectName,
  onBackToProjects,
  onLogout,
  onUnauthorized,
}: ChatProps) {
  const [intent, setIntent] = useState('');
  const [state, setState] = useState<ViewState>({ status: 'idle' });

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (intent.trim().length === 0) {
      return;
    }

    setState({ status: 'loading' });

    try {
      const response = await fetch(`${API_URL}/plan`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ intent, projectId }),
      });

      if (response.status === 401) {
        onUnauthorized();
        return;
      }

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message ?? `La requête a échoué (statut ${response.status}).`);
      }

      const data = (await response.json()) as { plan: Plan; result: OrchestrationResult };
      setState({ status: 'success', plan: data.plan, result: data.result });
    } catch (error) {
      setState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Erreur inconnue.',
      });
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm bg-violet-500" />
            <h1 className="text-base font-semibold tracking-tight text-zinc-100">
              Naminto IA <span className="font-normal text-zinc-500">— {projectName}</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button type="button" onClick={onBackToProjects} className="text-xs text-zinc-400 hover:text-zinc-200">
              ← Projets
            </button>
            <button type="button" onClick={onLogout} className="text-xs text-zinc-400 hover:text-zinc-200">
              Se déconnecter
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <p className="mb-6 text-sm text-zinc-400">
          Décris ce que tu veux construire — Naminto planifie, puis exécute.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <textarea
            value={intent}
            onChange={(event) => setIntent(event.target.value)}
            placeholder="Ex : crée un fichier hello.txt contenant 'Hello from Naminto'"
            rows={4}
            className="resize-none rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/40"
          />
          <button
            type="submit"
            disabled={state.status === 'loading' || intent.trim().length === 0}
            className="self-start rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {state.status === 'loading' ? 'Naminto réfléchit…' : 'Envoyer'}
          </button>
        </form>

        {state.status === 'idle' && (
          <p className="mt-8 text-sm text-zinc-500">Aucune demande envoyée pour l&apos;instant.</p>
        )}

        {state.status === 'error' && (
          <div
            role="alert"
            className="mt-8 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
          >
            <strong className="font-medium">Erreur :</strong> {state.message}
          </div>
        )}

        {state.status === 'success' && (
          <section className="mt-8 flex flex-col gap-6 rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
            <div>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">Plan</h2>
              <p className="mb-3 text-sm text-zinc-200">
                <span className="text-zinc-400">Objectif :</span> {state.plan.spec.objective}
              </p>
              <ul className="flex flex-col gap-2">
                {state.plan.tasks.map((task, index) => (
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
                    state.result.success
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-red-500/15 text-red-400'
                  }`}
                >
                  {state.result.success ? 'Succès' : 'Échec'}
                </span>
              </p>
              <div className="flex flex-col gap-2">
                {state.result.results.map((taskResult, index) => (
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
          </section>
        )}
      </main>
    </div>
  );
}
