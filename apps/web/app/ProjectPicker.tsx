'use client';

import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import type { Project } from '@namintoia/naminto-core';

type ListState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; projects: Project[] };

type CreateState = { status: 'idle' } | { status: 'loading' } | { status: 'error'; message: string };

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

  useEffect(() => {
    let cancelled = false;

    async function loadProjects(): Promise<void> {
      const response = await fetch(`${API_URL}/projects`, {
        headers: { authorization: `Bearer ${token}` },
      });

      if (cancelled) {
        return;
      }

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
    }

    loadProjects().catch(() => {
      if (!cancelled) {
        setListState({ status: 'error', message: 'Erreur inconnue.' });
      }
    });

    return () => {
      cancelled = true;
    };
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

  const creating = createState.status === 'loading';

  return (
    <main style={{ maxWidth: 420, margin: '4rem auto', padding: '0 1rem', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h1>Naminto IA</h1>
        <button type="button" onClick={onLogout} style={{ fontSize: '0.85rem' }}>
          Se déconnecter
        </button>
      </div>
      <p>Choisis un projet ou crée-en un nouveau.</p>

      {listState.status === 'loading' && <p>Chargement des projets…</p>}

      {listState.status === 'error' && (
        <div role="alert" style={{ marginTop: '1rem', color: '#b00020' }}>
          <strong>Erreur :</strong> {listState.message}
        </div>
      )}

      {listState.status === 'ready' && (
        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {listState.projects.length === 0 && <p style={{ color: '#666' }}>Aucun projet pour l&apos;instant.</p>}
          {listState.projects.map((project) => (
            <li key={project.id}>
              <button
                type="button"
                onClick={() => onSelectProject(project)}
                style={{ width: '100%', textAlign: 'left', padding: '0.6rem' }}
              >
                {project.name}
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={handleCreate}
        style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.5rem' }}
      >
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nom du projet"
          required
          style={{ padding: '0.6rem', fontSize: '1rem' }}
        />
        <button type="submit" disabled={creating || name.trim().length === 0}>
          {creating ? 'Création…' : 'Créer'}
        </button>
      </form>

      {createState.status === 'error' && (
        <div role="alert" style={{ marginTop: '1rem', color: '#b00020' }}>
          <strong>Erreur :</strong> {createState.message}
        </div>
      )}
    </main>
  );
}
