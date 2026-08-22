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

  describe('rename', () => {
    it('renames a project and reloads the list with the new name', async () => {
      let listedName = 'Website Refresh';
      const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
        if (init?.method === 'PATCH') {
          listedName = (JSON.parse(init.body as string) as { name: string }).name;
          return new Response(JSON.stringify({ ...PROJECT_A, name: listedName }), { status: 200 });
        }
        return new Response(JSON.stringify({ projects: [{ ...PROJECT_A, name: listedName }] }), {
          status: 200,
        });
      });
      globalThis.fetch = fetchMock as unknown as typeof fetch;

      renderPicker();
      await waitFor(() => expect(screen.getByText('Website Refresh')).toBeTruthy());

      fireEvent.click(screen.getByRole('button', { name: 'Renommer' }));
      const input = screen.getByDisplayValue('Website Refresh');
      fireEvent.change(input, { target: { value: 'New Name' } });
      fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

      await waitFor(() => expect(screen.getByText('New Name')).toBeTruthy());
    });

    it('cancelling a rename leaves the project unchanged', async () => {
      globalThis.fetch = vi.fn(
        async () => new Response(JSON.stringify({ projects: [PROJECT_A] }), { status: 200 }),
      ) as unknown as typeof fetch;

      renderPicker();
      await waitFor(() => expect(screen.getByText('Website Refresh')).toBeTruthy());

      fireEvent.click(screen.getByRole('button', { name: 'Renommer' }));
      fireEvent.change(screen.getByDisplayValue('Website Refresh'), { target: { value: 'Ignored' } });
      fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));

      expect(screen.getByText('Website Refresh')).toBeTruthy();
      expect(screen.queryByText('Ignored')).toBeNull();
    });

    it('shows an error alert when renaming fails', async () => {
      const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
        if (init?.method === 'PATCH') {
          return new Response(JSON.stringify({ message: 'rename failed' }), { status: 500 });
        }
        return new Response(JSON.stringify({ projects: [PROJECT_A] }), { status: 200 });
      });
      globalThis.fetch = fetchMock as unknown as typeof fetch;

      renderPicker();
      await waitFor(() => expect(screen.getByText('Website Refresh')).toBeTruthy());

      fireEvent.click(screen.getByRole('button', { name: 'Renommer' }));
      fireEvent.change(screen.getByDisplayValue('Website Refresh'), { target: { value: 'New Name' } });
      fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

      await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
      expect(screen.getByText(/rename failed/)).toBeTruthy();
    });
  });

  describe('delete', () => {
    it('does nothing until the deletion is confirmed', async () => {
      globalThis.fetch = vi.fn(
        async () => new Response(JSON.stringify({ projects: [PROJECT_A] }), { status: 200 }),
      ) as unknown as typeof fetch;

      renderPicker();
      await waitFor(() => expect(screen.getByText('Website Refresh')).toBeTruthy());

      fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));
      expect(screen.getByText(/Confirmer la suppression/)).toBeTruthy();

      fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
      expect(screen.getByText('Website Refresh')).toBeTruthy();
    });

    it('removes the project from the list once confirmed', async () => {
      let deleted = false;
      const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
        if (init?.method === 'DELETE') {
          deleted = true;
          return new Response(JSON.stringify({ success: true }), { status: 200 });
        }
        return new Response(JSON.stringify({ projects: deleted ? [] : [PROJECT_A] }), { status: 200 });
      });
      globalThis.fetch = fetchMock as unknown as typeof fetch;

      renderPicker();
      await waitFor(() => expect(screen.getByText('Website Refresh')).toBeTruthy());

      fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));
      fireEvent.click(screen.getByRole('button', { name: 'Oui, supprimer' }));

      await waitFor(() => expect(screen.getByText(/Aucun projet/)).toBeTruthy());
    });

    it('shows an error alert when deletion fails', async () => {
      const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
        if (init?.method === 'DELETE') {
          return new Response(JSON.stringify({ message: 'delete failed' }), { status: 500 });
        }
        return new Response(JSON.stringify({ projects: [PROJECT_A] }), { status: 200 });
      });
      globalThis.fetch = fetchMock as unknown as typeof fetch;

      renderPicker();
      await waitFor(() => expect(screen.getByText('Website Refresh')).toBeTruthy());

      fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));
      fireEvent.click(screen.getByRole('button', { name: 'Oui, supprimer' }));

      await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
      expect(screen.getByText(/delete failed/)).toBeTruthy();
    });
  });
});
