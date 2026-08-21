'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import type { OrchestrationResult, Plan } from '@namintoia/naminto-core';

type ViewState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; plan: Plan; result: OrchestrationResult };

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function HomePage() {
  const [intent, setIntent] = useState('');
  const [state, setState] = useState<ViewState>({ status: 'idle' });

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (intent.trim().length === 0) {
      return;
    }

    setState({ status: 'loading' });

    try {
      const response = await fetch(`${API_URL}/plan`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ intent }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message ?? `La requête a échoué (statut ${response.status}).`);
      }

      const data = (await response.json()) as { plan: Plan; result: OrchestrationResult };
      setState({ status: 'success', plan: data.plan, result: data.result });
    } catch (error) {
      setState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Erreur inconnue.',
      });
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Naminto IA</h1>
      <p>Décris ce que tu veux construire — Naminto planifie, puis exécute.</p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <textarea
          value={intent}
          onChange={(event) => setIntent(event.target.value)}
          placeholder="Ex : crée un fichier hello.txt contenant 'Hello from Naminto'"
          rows={4}
          style={{ padding: '0.75rem', fontSize: '1rem', fontFamily: 'inherit' }}
        />
        <button type="submit" disabled={state.status === 'loading' || intent.trim().length === 0}>
          {state.status === 'loading' ? 'Naminto réfléchit…' : 'Envoyer'}
        </button>
      </form>

      {state.status === 'idle' && (
        <p style={{ color: '#666', marginTop: '1.5rem' }}>Aucune demande envoyée pour l&apos;instant.</p>
      )}

      {state.status === 'error' && (
        <div role="alert" style={{ marginTop: '1.5rem', color: '#b00020' }}>
          <strong>Erreur :</strong> {state.message}
        </div>
      )}

      {state.status === 'success' && (
        <section style={{ marginTop: '1.5rem' }}>
          <h2>Plan</h2>
          <p>
            <strong>Objectif :</strong> {state.plan.spec.objective}
          </p>
          <ul>
            {state.plan.tasks.map((task, index) => (
              <li key={index}>
                <strong>{task.agentRole}</strong> — {task.instruction}
              </li>
            ))}
          </ul>

          <h2>Résultat</h2>
          <p>
            Statut :{' '}
            <strong style={{ color: state.result.success ? '#2e7d32' : '#b00020' }}>
              {state.result.success ? 'Succès' : 'Échec'}
            </strong>
          </p>
          {state.result.results.map((taskResult, index) => (
            <pre
              key={index}
              style={{ background: '#f5f5f5', padding: '0.75rem', overflowX: 'auto', whiteSpace: 'pre-wrap' }}
            >
              [{taskResult.role}] {taskResult.success ? 'OK' : 'ÉCHEC'}
              {'\n'}
              {taskResult.output}
            </pre>
          ))}
        </section>
      )}
    </main>
  );
}
