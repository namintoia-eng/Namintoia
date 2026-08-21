'use client';

import { useEffect, useState } from 'react';
import AuthForm from './AuthForm';
import Chat from './Chat';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const TOKEN_STORAGE_KEY = 'naminto_token';

type AuthState =
  | { status: 'checking' }
  | { status: 'anonymous' }
  | { status: 'authenticated'; token: string };

export default function HomePage() {
  const [auth, setAuth] = useState<AuthState>({ status: 'checking' });

  useEffect(() => {
    const stored = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!stored) {
      setAuth({ status: 'anonymous' });
      return;
    }

    fetch(`${API_URL}/auth/me`, { headers: { authorization: `Bearer ${stored}` } })
      .then((response) => {
        if (!response.ok) {
          throw new Error('invalid session');
        }
        setAuth({ status: 'authenticated', token: stored });
      })
      .catch(() => {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
        setAuth({ status: 'anonymous' });
      });
  }, []);

  function handleAuthenticated(token: string): void {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    setAuth({ status: 'authenticated', token });
  }

  function handleLogout(): void {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    setAuth({ status: 'anonymous' });
  }

  if (auth.status === 'checking') {
    return (
      <main
        style={{ maxWidth: 420, margin: '4rem auto', padding: '0 1rem', fontFamily: 'system-ui, sans-serif' }}
      >
        <p>Chargement…</p>
      </main>
    );
  }

  if (auth.status === 'anonymous') {
    return <AuthForm onAuthenticated={handleAuthenticated} />;
  }

  return <Chat token={auth.token} onLogout={handleLogout} onUnauthorized={handleLogout} />;
}
