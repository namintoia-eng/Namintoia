'use client';

import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import type { ConversationTurn, OrchestrationResult, Plan } from '@namintoia/naminto-core';
import PlanResult from './PlanResult';

type ViewState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; plan: Plan; result: OrchestrationResult };

type HistoryState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; turns: ConversationTurn[] };

type FilesState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; files: string[] };

type SelectedFileState =
  | { status: 'idle' }
  | { status: 'loading'; path: string }
  | { status: 'error'; path: string; message: string }
  | { status: 'ready'; path: string; content: string };

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
  const [historyState, setHistoryState] = useState<HistoryState>({ status: 'loading' });
  const [filesState, setFilesState] = useState<FilesState>({ status: 'loading' });
  const [selectedFile, setSelectedFile] = useState<SelectedFileState>({ status: 'idle' });

  async function loadHistory(): Promise<void> {
    setHistoryState({ status: 'loading' });
    try {
      const response = await fetch(`${API_URL}/plan/${projectId}`, {
        headers: { authorization: `Bearer ${token}` },
      });
      if (response.status === 401) {
        onUnauthorized();
        return;
      }
      if (!response.ok) {
        setHistoryState({
          status: 'error',
          message: `Impossible de charger l'historique (statut ${response.status}).`,
        });
        return;
      }
      const data = (await response.json()) as { turns: ConversationTurn[] };
      setHistoryState({ status: 'ready', turns: data.turns });
    } catch {
      setHistoryState({ status: 'error', message: 'Erreur inconnue.' });
    }
  }

  async function loadFiles(): Promise<void> {
    setFilesState({ status: 'loading' });
    try {
      const response = await fetch(`${API_URL}/plan/${projectId}/files`, {
        headers: { authorization: `Bearer ${token}` },
      });
      if (response.status === 401) {
        onUnauthorized();
        return;
      }
      if (!response.ok) {
        setFilesState({
          status: 'error',
          message: `Impossible de charger les fichiers (statut ${response.status}).`,
        });
        return;
      }
      const data = (await response.json()) as { files: string[] };
      setFilesState({ status: 'ready', files: data.files });
    } catch {
      setFilesState({ status: 'error', message: 'Erreur inconnue.' });
    }
  }

  useEffect(() => {
    loadHistory().catch(() => undefined);
    loadFiles().catch(() => undefined);
    setSelectedFile({ status: 'idle' });
  }, [projectId, token]);

  async function handleFileClick(path: string): Promise<void> {
    if (selectedFile.status !== 'idle' && selectedFile.path === path) {
      setSelectedFile({ status: 'idle' });
      return;
    }

    setSelectedFile({ status: 'loading', path });

    try {
      const response = await fetch(`${API_URL}/plan/${projectId}/file?path=${encodeURIComponent(path)}`, {
        headers: { authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        onUnauthorized();
        return;
      }

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        setSelectedFile({
          status: 'error',
          path,
          message: body?.message ?? `Impossible de lire ce fichier (statut ${response.status}).`,
        });
        return;
      }

      const data = (await response.json()) as { path: string; content: string };
      setSelectedFile({ status: 'ready', path: data.path, content: data.content });
    } catch {
      setSelectedFile({ status: 'error', path, message: 'Erreur inconnue.' });
    }
  }

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
      loadHistory().catch(() => undefined);
      loadFiles().catch(() => undefined);
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
          <section className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
            <PlanResult plan={state.plan} result={state.result} />
          </section>
        )}

        <section className="mt-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">Historique</h2>

          {historyState.status === 'loading' && <p className="text-sm text-zinc-500">Chargement…</p>}

          {historyState.status === 'error' && (
            <div
              role="alert"
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
            >
              <strong className="font-medium">Erreur :</strong> {historyState.message}
            </div>
          )}

          {historyState.status === 'ready' && (
            <>
              {historyState.turns.length === 0 && (
                <p className="text-sm text-zinc-500">Aucune demande dans l&apos;historique.</p>
              )}
              <ul className="flex flex-col gap-2">
                {[...historyState.turns].reverse().map((turn) => (
                  <li key={turn.id}>
                    <details className="rounded-lg border border-zinc-800 bg-zinc-900/40 open:bg-zinc-900/60">
                      <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm text-zinc-200">
                        <span className="truncate">{turn.intent}</span>
                        <span className="flex shrink-0 items-center gap-3">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              turn.result.success
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : 'bg-red-500/15 text-red-400'
                            }`}
                          >
                            {turn.result.success ? 'Succès' : 'Échec'}
                          </span>
                          <span className="text-xs text-zinc-500">
                            {new Date(turn.createdAt).toLocaleString('fr-FR')}
                          </span>
                        </span>
                      </summary>
                      <div className="border-t border-zinc-800 p-4">
                        <PlanResult plan={turn.plan} result={turn.result} />
                      </div>
                    </details>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section className="mt-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">Fichiers</h2>

          {filesState.status === 'loading' && <p className="text-sm text-zinc-500">Chargement…</p>}

          {filesState.status === 'error' && (
            <div
              role="alert"
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
            >
              <strong className="font-medium">Erreur :</strong> {filesState.message}
            </div>
          )}

          {filesState.status === 'ready' && (
            <>
              {filesState.files.length === 0 && (
                <p className="text-sm text-zinc-500">Aucun fichier pour l&apos;instant.</p>
              )}
              <ul className="flex flex-col gap-2">
                {filesState.files.map((path) => (
                  <li key={path}>
                    <button
                      type="button"
                      onClick={() => handleFileClick(path)}
                      className="w-full rounded-lg border border-zinc-700/50 bg-zinc-800/40 px-4 py-2.5 text-left font-mono text-xs text-zinc-200 transition-colors hover:border-zinc-700 hover:bg-zinc-800"
                    >
                      {path}
                    </button>
                    {selectedFile.status !== 'idle' && selectedFile.path === path && (
                      <div className="mt-2">
                        {selectedFile.status === 'loading' && (
                          <p className="text-sm text-zinc-500">Chargement…</p>
                        )}
                        {selectedFile.status === 'error' && (
                          <div
                            role="alert"
                            className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
                          >
                            <strong className="font-medium">Erreur :</strong> {selectedFile.message}
                          </div>
                        )}
                        {selectedFile.status === 'ready' && (
                          <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-xs text-zinc-300">
                            {selectedFile.content}
                          </pre>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
