'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';

type Mode = 'login' | 'register';
type FormState = { status: 'idle' } | { status: 'loading' } | { status: 'error'; message: string };

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface AuthFormProps {
  onAuthenticated: (token: string) => void;
}

export default function AuthForm({ onAuthenticated }: AuthFormProps) {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [state, setState] = useState<FormState>({ status: 'idle' });

  async function login(loginEmail: string, loginPassword: string): Promise<void> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: loginEmail, password: loginPassword }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { message?: string } | null;
      throw new Error(body?.message ?? `La connexion a échoué (statut ${response.status}).`);
    }

    const data = (await response.json()) as { token: string };
    onAuthenticated(data.token);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setState({ status: 'loading' });

    try {
      if (mode === 'register') {
        const response = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { message?: string } | null;
          throw new Error(body?.message ?? `L'inscription a échoué (statut ${response.status}).`);
        }
      }

      // After registering, log in right away rather than asking for the
      // same credentials twice.
      await login(email, password);
    } catch (error) {
      setState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Erreur inconnue.',
      });
    }
  }

  const loading = state.status === 'loading';

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-xl shadow-black/20">
        <div className="mb-1 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-violet-500" />
          <h1 className="text-lg font-semibold tracking-tight text-zinc-100">Naminto IA</h1>
        </div>
        <p className="mb-6 text-sm text-zinc-400">
          {mode === 'login' ? 'Connecte-toi pour continuer.' : 'Crée un compte pour commencer.'}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="email@exemple.com"
            required
            className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/40"
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Mot de passe (8 caractères minimum)"
            required
            minLength={8}
            className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/40"
          />
          <button
            type="submit"
            disabled={loading}
            className="mt-1 rounded-lg bg-violet-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Un instant…' : mode === 'login' ? 'Se connecter' : "S'inscrire"}
          </button>
        </form>

        {state.status === 'error' && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
          >
            <strong className="font-medium">Erreur :</strong> {state.message}
          </div>
        )}

        <p className="mt-6 text-sm text-zinc-400">
          {mode === 'login' ? (
            <>
              Pas encore de compte ?{' '}
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-violet-400 underline-offset-2 hover:text-violet-300 hover:underline"
              >
                S&apos;inscrire
              </button>
            </>
          ) : (
            <>
              Déjà un compte ?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-violet-400 underline-offset-2 hover:text-violet-300 hover:underline"
              >
                Se connecter
              </button>
            </>
          )}
        </p>
      </div>
    </main>
  );
}
