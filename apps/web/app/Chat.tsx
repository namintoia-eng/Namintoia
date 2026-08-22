'use client';

import type { FormEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import type { AgentRole, ConversationTurn, OrchestrationResult, Plan } from '@namintoia/naminto-core';
import PlanResult from './PlanResult';

interface TaskProgress {
  role: AgentRole;
  instruction: string;
  status: 'running' | 'success' | 'failed';
  output?: string;
}

/** The exchange currently being submitted — rendered optimistically at the bottom of the
 * thread. On success it folds directly into `historyState` (see the 'done' case below) and
 * this resets to 'idle', so there is no separate "success" status to render here. */
type ViewState =
  | { status: 'idle' }
  | { status: 'streaming'; intent: string; plan?: Plan; tasks: TaskProgress[] }
  | { status: 'error'; intent: string; message: string };

/** Mirrors apps/api/src/plan/plan.controller.ts's PlanStreamEvent (DECISIONS.md D-21) — no
 * shared DTO package between apps/api and apps/web today, same convention already used for
 * every other /plan response shape in this file. */
type PlanStreamEvent =
  | { type: 'planning' }
  | { type: 'plan_ready'; plan: Plan }
  | { type: 'task_start'; role: AgentRole; instruction: string }
  | { type: 'task_output'; role: AgentRole; data: string }
  | { type: 'task_complete'; role: AgentRole; success: boolean; output: string }
  | { type: 'done'; plan: Plan; result: OrchestrationResult; turnId: string }
  | { type: 'error'; message: string };

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
  const [filesOpen, setFilesOpen] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);
  const currentIntentRef = useRef('');

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

  useEffect(() => {
    const el = threadRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [historyState, state]);

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

  function handleStreamEvent(event: PlanStreamEvent): void {
    switch (event.type) {
      case 'planning':
        setState((prev) =>
          prev.status === 'streaming' ? { ...prev, plan: undefined, tasks: [] } : prev,
        );
        return;
      case 'plan_ready':
        setState((prev) => (prev.status === 'streaming' ? { ...prev, plan: event.plan } : prev));
        return;
      case 'task_start':
        setState((prev) =>
          prev.status === 'streaming'
            ? {
                ...prev,
                tasks: [
                  ...prev.tasks,
                  { role: event.role, instruction: event.instruction, status: 'running', output: '' },
                ],
              }
            : prev,
        );
        return;
      case 'task_output':
        setState((prev) => {
          if (prev.status !== 'streaming' || prev.tasks.length === 0) {
            return prev;
          }
          const tasks = [...prev.tasks];
          const lastIndex = tasks.length - 1;
          const last = tasks[lastIndex];
          if (!last) {
            return prev;
          }
          tasks[lastIndex] = { ...last, output: (last.output ?? '') + event.data };
          return { ...prev, tasks };
        });
        return;
      case 'task_complete':
        setState((prev) => {
          if (prev.status !== 'streaming' || prev.tasks.length === 0) {
            return prev;
          }
          const tasks = [...prev.tasks];
          const lastIndex = tasks.length - 1;
          const last = tasks[lastIndex];
          if (!last) {
            return prev;
          }
          tasks[lastIndex] = {
            ...last,
            status: event.success ? 'success' : 'failed',
            output: event.output,
          };
          return { ...prev, tasks };
        });
        return;
      case 'done': {
        // Fold the finished exchange straight into the history list from the SSE payload
        // itself (already authoritative — same plan/result the server just saved) instead of
        // refetching: a refetch could race the mocked/real network and briefly show this
        // exchange twice (once from local state, once from the refreshed list) or, worse,
        // briefly show it zero times if the refresh resolves before the render settles.
        const newTurn: ConversationTurn = {
          id: event.turnId,
          projectId,
          intent: currentIntentRef.current,
          plan: event.plan,
          result: event.result,
          createdAt: new Date().toISOString(),
        };
        setHistoryState((previousHistory) => ({
          status: 'ready',
          turns: [...(previousHistory.status === 'ready' ? previousHistory.turns : []), newTurn],
        }));
        setState({ status: 'idle' });
        loadFiles().catch(() => undefined);
        return;
      }
      case 'error':
        setState({ status: 'error', intent: currentIntentRef.current, message: event.message });
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const submittedIntent = intent.trim();
    if (submittedIntent.length === 0) {
      return;
    }

    setIntent('');
    currentIntentRef.current = submittedIntent;
    setState({ status: 'streaming', intent: submittedIntent, tasks: [] });

    try {
      const response = await fetch(`${API_URL}/plan`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ intent: submittedIntent, projectId }),
      });

      if (response.status === 401) {
        onUnauthorized();
        return;
      }

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message ?? `La requête a échoué (statut ${response.status}).`);
      }

      if (!response.body) {
        throw new Error('Streaming non supporté par ce navigateur.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        buffer += decoder.decode(value, { stream: true });

        let separatorIndex: number;
        while ((separatorIndex = buffer.indexOf('\n\n')) !== -1) {
          const rawEvent = buffer.slice(0, separatorIndex);
          buffer = buffer.slice(separatorIndex + 2);

          const dataLine = rawEvent.split('\n').find((line) => line.startsWith('data: '));
          if (!dataLine) {
            continue;
          }
          handleStreamEvent(JSON.parse(dataLine.slice(6)) as PlanStreamEvent);
        }
      }
    } catch (error) {
      setState({
        status: 'error',
        intent: submittedIntent,
        message: error instanceof Error ? error.message : 'Erreur inconnue.',
      });
    }
  }

  const streaming = state.status === 'streaming';
  const historyTurns = historyState.status === 'ready' ? historyState.turns : [];
  const filesCount = filesState.status === 'ready' ? filesState.files.length : 0;

  return (
    <div className="flex h-screen flex-col bg-zinc-950">
      <header className="shrink-0 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
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
            <button
              type="button"
              onClick={() => setFilesOpen((open) => !open)}
              className="text-xs text-zinc-400 hover:text-zinc-200"
            >
              Fichiers{filesCount > 0 ? ` (${filesCount})` : ''}
            </button>
            <button type="button" onClick={onLogout} className="text-xs text-zinc-400 hover:text-zinc-200">
              Se déconnecter
            </button>
          </div>
        </div>
      </header>

      <div ref={threadRef} className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-6">
          {historyState.status === 'loading' && (
            <p className="text-sm text-zinc-500">Chargement…</p>
          )}

          {historyState.status === 'error' && (
            <div
              role="alert"
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
            >
              <strong className="font-medium">Erreur :</strong> {historyState.message}
            </div>
          )}

          {historyState.status === 'ready' && historyTurns.length === 0 && state.status === 'idle' && (
            <p className="text-sm text-zinc-500">
              Aucune conversation pour l&apos;instant. Décris ce que tu veux construire ci-dessous.
            </p>
          )}

          {historyTurns.map((turn) => (
            <div key={turn.id} className="flex flex-col gap-3">
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-violet-600 px-4 py-2.5 text-sm text-white">
                  {turn.intent}
                </div>
              </div>
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-200">
                  <PlanResult plan={turn.plan} result={turn.result} />
                </div>
              </div>
            </div>
          ))}

          {state.status !== 'idle' && (
            <div className="flex flex-col gap-3">
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-violet-600 px-4 py-2.5 text-sm text-white">
                  {state.intent}
                </div>
              </div>
              <div className="flex justify-start">
                {state.status === 'error' ? (
                  <div
                    role="alert"
                    className="max-w-[85%] rounded-2xl rounded-bl-sm border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
                  >
                    <strong className="font-medium">Erreur :</strong> {state.message}
                  </div>
                ) : (
                  <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-200">
                    {!state.plan && <p className="text-sm text-zinc-400">Planification en cours…</p>}
                    {state.plan && (
                      <p className="mb-3 text-sm text-zinc-200">
                        <span className="text-zinc-400">Objectif :</span> {state.plan.spec.objective}
                      </p>
                    )}
                    {state.tasks.length > 0 && (
                      <ul className="flex flex-col gap-3">
                        {state.tasks.map((task, index) => (
                          <li key={index} className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-sm text-zinc-300">
                              <span className="shrink-0 rounded-full bg-zinc-800 px-2 py-0.5 text-xs uppercase tracking-wide text-zinc-400">
                                {task.role}
                              </span>
                              <span className="flex-1">{task.instruction}</span>
                              {task.status === 'running' && (
                                <span className="shrink-0 text-zinc-500">en cours…</span>
                              )}
                              {task.status === 'success' && (
                                <span className="shrink-0 text-emerald-400">✓</span>
                              )}
                              {task.status === 'failed' && <span className="shrink-0 text-red-400">✗</span>}
                            </div>
                            {task.output && (
                              <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-400">
                                {task.output}
                              </pre>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-zinc-800 bg-zinc-950/80 px-4 py-4 backdrop-blur">
        <form onSubmit={handleSubmit} className="mx-auto flex max-w-2xl items-end gap-3">
          <textarea
            value={intent}
            onChange={(event) => setIntent(event.target.value)}
            placeholder="Ex : crée un fichier hello.txt contenant 'Hello from Naminto'"
            rows={2}
            className="flex-1 resize-none rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/40"
          />
          <button
            type="submit"
            disabled={streaming || intent.trim().length === 0}
            className="shrink-0 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {streaming ? 'Naminto réfléchit…' : 'Envoyer'}
          </button>
        </form>
      </div>

      {filesOpen && (
        <aside className="fixed inset-y-0 right-0 z-20 flex w-80 flex-col overflow-y-auto border-l border-zinc-800 bg-zinc-950 p-4 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Fichiers</h2>
            <button
              type="button"
              onClick={() => setFilesOpen(false)}
              className="text-xs text-zinc-400 hover:text-zinc-200"
            >
              Fermer
            </button>
          </div>

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
        </aside>
      )}
    </div>
  );
}
