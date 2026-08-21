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
    <main style={{ maxWidth: 420, margin: '4rem auto', padding: '0 1rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Naminto IA</h1>
      <p>{mode === 'login' ? 'Connecte-toi pour continuer.' : 'Crée un compte pour commencer.'}</p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="email@exemple.com"
          required
          style={{ padding: '0.6rem', fontSize: '1rem' }}
        />
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Mot de passe (8 caractères minimum)"
          required
          minLength={8}
          style={{ padding: '0.6rem', fontSize: '1rem' }}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Un instant…' : mode === 'login' ? 'Se connecter' : "S'inscrire"}
        </button>
      </form>

      {state.status === 'error' && (
        <div role="alert" style={{ marginTop: '1rem', color: '#b00020' }}>
          <strong>Erreur :</strong> {state.message}
        </div>
      )}

      <p style={{ marginTop: '1.5rem' }}>
        {mode === 'login' ? (
          <>
            Pas encore de compte ?{' '}
            <button type="button" onClick={() => setMode('register')} style={{ padding: 0 }}>
              S&apos;inscrire
            </button>
          </>
        ) : (
          <>
            Déjà un compte ?{' '}
            <button type="button" onClick={() => setMode('login')} style={{ padding: 0 }}>
              Se connecter
            </button>
          </>
        )}
      </p>
    </main>
  );
}
