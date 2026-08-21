import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AuthForm from './AuthForm';

function fillCredentials(email: string, password: string): void {
  fireEvent.change(screen.getByPlaceholderText('email@exemple.com'), { target: { value: email } });
  fireEvent.change(screen.getByPlaceholderText(/Mot de passe/), { target: { value: password } });
}

describe('AuthForm', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    cleanup();
  });

  it('renders the login form by default', () => {
    render(<AuthForm onAuthenticated={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Se connecter' })).toBeTruthy();
  });

  it('switches to the register form and back', () => {
    render(<AuthForm onAuthenticated={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: "S'inscrire" }));
    expect(screen.getByRole('button', { name: "S'inscrire" })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Se connecter' }));
    expect(screen.getByRole('button', { name: 'Se connecter' })).toBeTruthy();
  });

  it('logs in and reports the token on success', async () => {
    globalThis.fetch = vi.fn(async (_url) =>
      new Response(JSON.stringify({ token: 'tok_123' }), { status: 200 }),
    ) as unknown as typeof fetch;

    const onAuthenticated = vi.fn();
    render(<AuthForm onAuthenticated={onAuthenticated} />);
    fillCredentials('alice@example.com', 'password123');
    fireEvent.click(screen.getByRole('button', { name: 'Se connecter' }));

    await waitFor(() => expect(onAuthenticated).toHaveBeenCalledWith('tok_123'));
  });

  it('shows an error message when login fails', async () => {
    globalThis.fetch = vi.fn(
      async () => new Response(JSON.stringify({ message: 'invalid email or password' }), { status: 401 }),
    ) as unknown as typeof fetch;

    render(<AuthForm onAuthenticated={vi.fn()} />);
    fillCredentials('alice@example.com', 'wrongpassword');
    fireEvent.click(screen.getByRole('button', { name: 'Se connecter' }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    expect(screen.getByText(/invalid email or password/)).toBeTruthy();
  });

  it('registers then logs in automatically, hitting both endpoints', async () => {
    const calledUrls: string[] = [];
    globalThis.fetch = vi.fn(async (url: string) => {
      calledUrls.push(url);
      if (url.endsWith('/auth/register')) {
        return new Response(JSON.stringify({ id: 'u1' }), { status: 201 });
      }
      return new Response(JSON.stringify({ token: 'tok_new' }), { status: 200 });
    }) as unknown as typeof fetch;

    const onAuthenticated = vi.fn();
    render(<AuthForm onAuthenticated={onAuthenticated} />);
    fireEvent.click(screen.getByRole('button', { name: "S'inscrire" }));
    fillCredentials('bob@example.com', 'password123');
    fireEvent.click(screen.getByRole('button', { name: "S'inscrire" }));

    await waitFor(() => expect(onAuthenticated).toHaveBeenCalledWith('tok_new'));
    expect(calledUrls.some((u) => u.endsWith('/auth/register'))).toBe(true);
    expect(calledUrls.some((u) => u.endsWith('/auth/login'))).toBe(true);
  });

  it('shows an error and never logs in when registration itself fails', async () => {
    globalThis.fetch = vi.fn(
      async () => new Response(JSON.stringify({ message: 'already registered' }), { status: 409 }),
    ) as unknown as typeof fetch;

    const onAuthenticated = vi.fn();
    render(<AuthForm onAuthenticated={onAuthenticated} />);
    fireEvent.click(screen.getByRole('button', { name: "S'inscrire" }));
    fillCredentials('bob@example.com', 'password123');
    fireEvent.click(screen.getByRole('button', { name: "S'inscrire" }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    expect(screen.getByText(/already registered/)).toBeTruthy();
    expect(onAuthenticated).not.toHaveBeenCalled();
  });
});
