import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import HomePage from './page';

const TOKEN_STORAGE_KEY = 'naminto_token';

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

  it('shows the chat once a stored token is verified', async () => {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, 'valid-token');
    globalThis.fetch = vi.fn(async () => new Response(JSON.stringify({ id: 'u1' }), { status: 200 })) as unknown as typeof fetch;

    render(<HomePage />);

    await waitFor(() => expect(screen.getByPlaceholderText(/Ex :/)).toBeTruthy());
  });

  it('falls back to the login form and clears the token when the stored session is invalid', async () => {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, 'expired-token');
    globalThis.fetch = vi.fn(async () => new Response(null, { status: 401 })) as unknown as typeof fetch;

    render(<HomePage />);

    await waitFor(() => expect(screen.getByPlaceholderText('email@exemple.com')).toBeTruthy());
    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });
});
