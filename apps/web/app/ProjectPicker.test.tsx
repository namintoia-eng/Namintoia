import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ProjectPicker from './ProjectPicker';

const PROJECT_A = { id: 'proj-1', ownerId: 'u1', name: 'Website Refresh', createdAt: '2026-08-22T00:00:00.000Z' };

function renderPicker(overrides: Partial<Parameters<typeof ProjectPicker>[0]> = {}) {
  const onSelectProject = vi.fn();
  const onUnauthorized = vi.fn();
  const onLogout = vi.fn();
  render(
    <ProjectPicker
      token="fake-token"
      onSelectProject={onSelectProject}
      onUnauthorized={onUnauthorized}
      onLogout={onLogout}
      {...overrides}
    />,
  );
  return { onSelectProject, onUnauthorized, onLogout };
}

describe('ProjectPicker', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    cleanup();
  });

  it('renders the projects returned by GET /projects', async () => {
    globalThis.fetch = vi.fn(
      async () => new Response(JSON.stringify({ projects: [PROJECT_A] }), { status: 200 }),
    ) as unknown as typeof fetch;

    renderPicker();

    await waitFor(() => expect(screen.getByText('Website Refresh')).toBeTruthy());
  });

  it('shows an empty state when there are no projects yet', async () => {
    globalThis.fetch = vi.fn(
      async () => new Response(JSON.stringify({ projects: [] }), { status: 200 }),
    ) as unknown as typeof fetch;

    renderPicker();

    await waitFor(() => expect(screen.getByText(/Aucun projet/)).toBeTruthy());
  });

  it('calls onSelectProject when clicking a project', async () => {
    globalThis.fetch = vi.fn(
      async () => new Response(JSON.stringify({ projects: [PROJECT_A] }), { status: 200 }),
    ) as unknown as typeof fetch;

    const { onSelectProject } = renderPicker();

    await waitFor(() => expect(screen.getByText('Website Refresh')).toBeTruthy());
    fireEvent.click(screen.getByText('Website Refresh'));

    expect(onSelectProject).toHaveBeenCalledWith(PROJECT_A);
  });

  it('calls onUnauthorized when the project list fetch returns 401', async () => {
    globalThis.fetch = vi.fn(async () => new Response(null, { status: 401 })) as unknown as typeof fetch;

    const { onUnauthorized } = renderPicker();

    await waitFor(() => expect(onUnauthorized).toHaveBeenCalledTimes(1));
  });

  it('shows an error alert when the project list fetch fails', async () => {
    globalThis.fetch = vi.fn(
      async () => new Response(JSON.stringify({ message: 'Internal server error' }), { status: 500 }),
    ) as unknown as typeof fetch;

    renderPicker();

    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
  });

  it('creates a project and calls onSelectProject with it', async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === 'POST') {
        return new Response(JSON.stringify(PROJECT_A), { status: 201 });
      }
      return new Response(JSON.stringify({ projects: [] }), { status: 200 });
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const { onSelectProject } = renderPicker();

    await waitFor(() => expect(screen.getByText(/Aucun projet/)).toBeTruthy());

    fireEvent.change(screen.getByPlaceholderText('Nom du projet'), {
      target: { value: 'Website Refresh' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Créer' }));

    await waitFor(() => expect(onSelectProject).toHaveBeenCalledWith(PROJECT_A));
  });

  it('shows an error alert when project creation fails', async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === 'POST') {
        return new Response(JSON.stringify({ message: 'name required' }), { status: 400 });
      }
      return new Response(JSON.stringify({ projects: [] }), { status: 200 });
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    renderPicker();

    await waitFor(() => expect(screen.getByText(/Aucun projet/)).toBeTruthy());

    fireEvent.change(screen.getByPlaceholderText('Nom du projet'), { target: { value: 'x' } });
    fireEvent.click(screen.getByRole('button', { name: 'Créer' }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    expect(screen.getByText(/name required/)).toBeTruthy();
  });

  it('calls onLogout when the logout button is clicked', async () => {
    globalThis.fetch = vi.fn(
      async () => new Response(JSON.stringify({ projects: [] }), { status: 200 }),
    ) as unknown as typeof fetch;

    const { onLogout } = renderPicker();
    fireEvent.click(screen.getByRole('button', { name: /déconnecter/ }));

    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
