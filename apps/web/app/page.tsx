'use client';

import { useEffect, useState } from 'react';
import type { Project } from '@namintoia/naminto-core';
import AuthForm from './AuthForm';
import ProjectPicker from './ProjectPicker';
import Chat from './Chat';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const TOKEN_STORAGE_KEY = 'naminto_token';
const PROJECT_STORAGE_KEY = 'naminto_project_id';

type AuthState =
  | { status: 'checking' }
  | { status: 'anonymous' }
  | { status: 'authenticated'; token: string; project: Project | null };

export default function HomePage() {
  const [auth, setAuth] = useState<AuthState>({ status: 'checking' });

  useEffect(() => {
    const stored = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!stored) {
      setAuth({ status: 'anonymous' });
      return;
    }

    async function restoreSession(token: string): Promise<void> {
      const meResponse = await fetch(`${API_URL}/auth/me`, {
        headers: { authorization: `Bearer ${token}` },
      });
      if (!meResponse.ok) {
        throw new Error('invalid session');
      }

      const storedProjectId = window.localStorage.getItem(PROJECT_STORAGE_KEY);
      let project: Project | null = null;

      if (storedProjectId) {
        const projectsResponse = await fetch(`${API_URL}/projects`, {
          headers: { authorization: `Bearer ${token}` },
        });
        if (projectsResponse.ok) {
          const data = (await projectsResponse.json()) as { projects: Project[] };
          project = data.projects.find((p) => p.id === storedProjectId) ?? null;
        }
        if (!project) {
          window.localStorage.removeItem(PROJECT_STORAGE_KEY);
        }
      }

      setAuth({ status: 'authenticated', token, project });
    }

    restoreSession(stored).catch(() => {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      window.localStorage.removeItem(PROJECT_STORAGE_KEY);
      setAuth({ status: 'anonymous' });
    });
  }, []);

  function handleAuthenticated(token: string): void {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    setAuth({ status: 'authenticated', token, project: null });
  }

  function handleProjectSelected(project: Project): void {
    window.localStorage.setItem(PROJECT_STORAGE_KEY, project.id);
    setAuth((prev) => (prev.status === 'authenticated' ? { ...prev, project } : prev));
  }

  function handleBackToProjects(): void {
    window.localStorage.removeItem(PROJECT_STORAGE_KEY);
    setAuth((prev) => (prev.status === 'authenticated' ? { ...prev, project: null } : prev));
  }

  function handleLogout(): void {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    window.localStorage.removeItem(PROJECT_STORAGE_KEY);
    setAuth({ status: 'anonymous' });
  }

  if (auth.status === 'checking') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950">
        <p className="text-sm text-zinc-500">Chargement…</p>
      </main>
    );
  }

  if (auth.status === 'anonymous') {
    return <AuthForm onAuthenticated={handleAuthenticated} />;
  }

  if (auth.project === null) {
    return (
      <ProjectPicker
        token={auth.token}
        onSelectProject={handleProjectSelected}
        onUnauthorized={handleLogout}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <Chat
      token={auth.token}
      projectId={auth.project.id}
      projectName={auth.project.name}
      onBackToProjects={handleBackToProjects}
      onLogout={handleLogout}
      onUnauthorized={handleLogout}
    />
  );
}
