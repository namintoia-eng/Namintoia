import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import HomePage from './page';

const TOKEN_STORAGE_KEY = 'naminto_token';
const PROJECT_STORAGE_KEY = 'naminto_project_id';

const PROJECT_A = { id: 'proj-1', ownerId: 'u1', name: 'Website Refresh', createdAt: '2026-08-22T00:00:00.000Z' };

function mockFetchByUrl(responses: { auth?: Response; projects?: Response }) {
  return vi.fn(async (url: string) => {
    if (url.endsWith('/auth/me')) {
      return responses.auth ?? new Response(JSON.stringify({ id: 'u1' }), { status: 200 });
    }
    if (url.endsWith('/projects')) {
      return responses.projects ?? new Response(JSON.stringify({ projects: [] }), { status: 200 });
    }
    throw new Error(`Unexpected fetch to ${url}`);
  }) as unknown as typeof fetch;
}

describe('HomePage', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    cleanup();
  });

  it('shows the login form when there is no stored session', async () => {
    render(<HomePage />);
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Naminto IA' })).toBeTruthy());
    expect(screen.getByPlaceholderText('email@exemple.com')).toBeTruthy();
  });

  it('shows the project picker once a stored token is verified', async () => {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, 'valid-token');
    globalThis.fetch = mockFetchByUrl({});

    render(<HomePage />);

    await waitFor(() => expect(screen.getByPlaceholderText('Nom du projet')).toBeTruthy());
  });

  it('enters the chat for a project selected from the picker', async () => {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, 'valid-token');
    globalThis.fetch = mockFetchByUrl({
      projects: new Response(JSON.stringify({ projects: [PROJECT_A] }), { status: 200 }),
    });

    render(<HomePage />);

    await waitFor(() => expect(screen.getByText('Website Refresh')).toBeTruthy());
    fireEvent.click(screen.getByText('Website Refresh'));

    await waitFor(() => expect(screen.getByPlaceholderText(/Ex :/)).toBeTruthy());
    expect(window.localStorage.getItem(PROJECT_STORAGE_KEY)).toBe(PROJECT_A.id);
  });

  it('restores the previously selected project on reload instead of showing the picker', async () => {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, 'valid-token');
    window.localStorage.setItem(PROJECT_STORAGE_KEY, PROJECT_A.id);
    globalThis.fetch = mockFetchByUrl({
      projects: new Response(JSON.stringify({ projects: [PROJECT_A] }), { status: 200 }),
    });

    render(<HomePage />);

    await waitFor(() => expect(screen.getByPlaceholderText(/Ex :/)).toBeTruthy());
  });

  it('falls back to the picker and clears the stored project id when it no longer exists', async () => {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, 'valid-token');
    window.localStorage.setItem(PROJECT_STORAGE_KEY, 'does-not-exist');
    globalThis.fetch = mockFetchByUrl({
      projects: new Response(JSON.stringify({ projects: [PROJECT_A] }), { status: 200 }),
    });

    render(<HomePage />);

    await waitFor(() => expect(screen.getByPlaceholderText('Nom du projet')).toBeTruthy());
    expect(window.localStorage.getItem(PROJECT_STORAGE_KEY)).toBeNull();
  });

  it('falls back to the login form and clears stored session data when the token is invalid', async () => {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, 'expired-token');
    globalThis.fetch = mockFetchByUrl({ auth: new Response(null, { status: 401 }) });

    render(<HomePage />);

    await waitFor(() => expect(screen.getByPlaceholderText('email@exemple.com')).toBeTruthy());
    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
    expect(window.localStorage.getItem(PROJECT_STORAGE_KEY)).toBeNull();
  });
});
