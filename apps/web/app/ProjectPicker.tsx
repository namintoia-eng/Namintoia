'use client';

import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import type { Project } from '@namintoia/naminto-core';

type ListState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; projects: Project[] };

type CreateState = { status: 'idle' } | { status: 'loading' } | { status: 'error'; message: string };
type RenameState = { status: 'idle' } | { status: 'loading' } | { status: 'error'; message: string };
type DeleteState = { status: 'idle' } | { status: 'loading' } | { status: 'error'; message: string };

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface ProjectPickerProps {
  token: string;
  onSelectProject: (project: Project) => void;
  onUnauthorized: () => void;
  onLogout: () => void;
}

export default function ProjectPicker({
  token,
  onSelectProject,
  onUnauthorized,
  onLogout,
}: ProjectPickerProps) {
  const [listState, setListState] = useState<ListState>({ status: 'loading' });
  const [name, setName] = useState('');
  const [createState, setCreateState] = useState<CreateState>({ status: 'idle' });

  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [renameState, setRenameState] = useState<RenameState>({ status: 'idle' });

  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [deleteState, setDeleteState] = useState<DeleteState>({ status: 'idle' });

  async function loadProjects(): Promise<void> {
    setListState({ status: 'loading' });
    try {
      const response = await fetch(`${API_URL}/projects`, {
        headers: { authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        onUnauthorized();
        return;
      }

      if (!response.ok) {
        setListState({
          status: 'error',
          message: `Impossible de charger les projets (statut ${response.status}).`,
        });
        return;
      }

      const data = (await response.json()) as { projects: Project[] };
      setListState({ status: 'ready', projects: data.projects });
    } catch {
      setListState({ status: 'error', message: 'Erreur inconnue.' });
    }
  }

  useEffect(() => {
    loadProjects().catch(() => undefined);
  }, [token]);

  async function handleCreate(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setCreateState({ status: 'loading' });

    try {
      const response = await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ name }),
      });

      if (response.status === 401) {
        onUnauthorized();
        return;
      }

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message ?? `La création a échoué (statut ${response.status}).`);
      }

      const project = (await response.json()) as Project;
      onSelectProject(project);
    } catch (error) {
      setCreateState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Erreur inconnue.',
      });
    }
  }

  function startEditing(project: Project): void {
    setConfirmingDeleteId(null);
    setEditingProjectId(project.id);
    setEditingName(project.name);
    setRenameState({ status: 'idle' });
  }

  function cancelEditing(): void {
    setEditingProjectId(null);
    setRenameState({ status: 'idle' });
  }

  async function handleRename(projectId: string): Promise<void> {
    if (editingName.trim().length === 0) {
      return;
    }
    setRenameState({ status: 'loading' });

    try {
      const response = await fetch(`${API_URL}/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: editingName }),
      });

      if (response.status === 401) {
        onUnauthorized();
        return;
      }

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message ?? `Le renommage a échoué (statut ${response.status}).`);
      }

      setEditingProjectId(null);
      setRenameState({ status: 'idle' });
      await loadProjects();
    } catch (error) {
      setRenameState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Erreur inconnue.',
      });
    }
  }

  function startDeleteConfirm(projectId: string): void {
    setEditingProjectId(null);
    setConfirmingDeleteId(projectId);
    setDeleteState({ status: 'idle' });
  }

  function cancelDelete(): void {
    setConfirmingDeleteId(null);
    setDeleteState({ status: 'idle' });
  }

  async function handleDelete(projectId: string): Promise<void> {
    setDeleteState({ status: 'loading' });

    try {
      const response = await fetch(`${API_URL}/projects/${projectId}`, {
        method: 'DELETE',
        headers: { authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        onUnauthorized();
        return;
      }

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message ?? `La suppression a échoué (statut ${response.status}).`);
      }

      setConfirmingDeleteId(null);
      setDeleteState({ status: 'idle' });
      await loadProjects();
    } catch (error) {
      setDeleteState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Erreur inconnue.',
      });
    }
  }

  const creating = createState.status === 'loading';

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-xl shadow-black/20">
        <div className="mb-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm bg-violet-500" />
            <h1 className="text-lg font-semibold tracking-tight text-zinc-100">Naminto IA</h1>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="text-xs text-zinc-400 hover:text-zinc-200"
          >
            Se déconnecter
          </button>
        </div>
        <p className="mb-6 text-sm text-zinc-400">Choisis un projet ou crée-en un nouveau.</p>

        {listState.status === 'loading' && <p className="text-sm text-zinc-500">Chargement des projets…</p>}

        {listState.status === 'error' && (
          <div
            role="alert"
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
          >
            <strong className="font-medium">Erreur :</strong> {listState.message}
          </div>
        )}

        {listState.status === 'ready' && (
          <ul className="flex flex-col gap-2">
            {listState.projects.length === 0 && (
              <p className="text-sm italic text-zinc-500">Aucun projet pour l&apos;instant.</p>
            )}
            {listState.projects.map((project) => (
              <li key={project.id}>
                {editingProjectId === project.id ? (
                  <div className="flex items-center gap-2 rounded-lg border border-zinc-700/50 bg-zinc-800/40 p-2">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(event) => setEditingName(event.target.value)}
                      className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 text-sm text-zinc-100 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/40"
                    />
                    <button
                      type="button"
                      onClick={() => handleRename(project.id)}
                      disabled={renameState.status === 'loading' || editingName.trim().length === 0}
                      className="shrink-0 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Enregistrer
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="shrink-0 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-zinc-600"
                    >
                      Annuler
                    </button>
                  </div>
                ) : confirmingDeleteId === project.id ? (
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                    <span className="text-sm text-red-300">Confirmer la suppression ?</span>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => handleDelete(project.id)}
                        disabled={deleteState.status === 'loading'}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Oui, supprimer
                      </button>
                      <button
                        type="button"
                        onClick={cancelDelete}
                        className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-zinc-600"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectProject(project)}
                      className="flex-1 rounded-lg border border-zinc-700/50 bg-zinc-800/40 px-4 py-3 text-left text-sm text-zinc-100 transition-colors hover:border-zinc-700 hover:bg-zinc-800"
                    >
                      {project.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => startEditing(project)}
                      className="shrink-0 text-xs text-zinc-400 hover:text-zinc-200"
                    >
                      Renommer
                    </button>
                    <button
                      type="button"
                      onClick={() => startDeleteConfirm(project.id)}
                      className="shrink-0 text-xs text-zinc-400 hover:text-red-400"
                    >
                      Supprimer
                    </button>
                  </div>
                )}

                {renameState.status === 'error' && editingProjectId === project.id && (
                  <div role="alert" className="mt-1 text-xs text-red-400">
                    {renameState.message}
                  </div>
                )}
                {deleteState.status === 'error' && confirmingDeleteId === project.id && (
                  <div role="alert" className="mt-1 text-xs text-red-400">
                    {deleteState.message}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleCreate} className="mt-6 flex flex-col gap-3 border-t border-zinc-800 pt-6">
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nom du projet"
            required
            className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/40"
          />
          <button
            type="submit"
            disabled={creating || name.trim().length === 0}
            className="rounded-lg bg-violet-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating ? 'Création…' : 'Créer'}
          </button>
        </form>

        {createState.status === 'error' && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
          >
            <strong className="font-medium">Erreur :</strong> {createState.message}
          </div>
        )}
      </div>
    </main>
  );
}
