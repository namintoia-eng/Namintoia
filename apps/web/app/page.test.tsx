import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import HomePage from './page';

const FAKE_PLAN = {
  intent: 'add hello.txt',
  spec: {
    objective: 'Add hello.txt',
    requirements: { functional: [], nonFunctional: [], constraints: [] },
    architecture: { modulesInvolved: [], newInterfaces: [] },
    components: [],
    interfaces: [],
  },
  tasks: [{ agentRole: 'coding', instruction: 'write hello.txt' }],
};

function submitIntent(text: string): void {
  fireEvent.change(screen.getByPlaceholderText(/Ex :/), { target: { value: text } });
  fireEvent.click(screen.getByRole('button', { name: /Envoyer/ }));
}

describe('HomePage', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    cleanup();
  });

  it('renders the heading and the empty state before any submission', () => {
    render(<HomePage />);
    expect(screen.getByRole('heading', { name: 'Naminto IA' })).toBeTruthy();
    expect(screen.getByText(/Aucune demande envoyée/)).toBeTruthy();
  });

  it('shows the plan and a successful result after submitting', async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          plan: FAKE_PLAN,
          result: {
            plan: FAKE_PLAN,
            results: [{ role: 'coding', success: true, output: 'hello.txt written' }],
            success: true,
          },
        }),
        { status: 200 },
      ),
    ) as unknown as typeof fetch;

    render(<HomePage />);
    submitIntent('add hello.txt');

    await waitFor(() => expect(screen.getByText('Succès')).toBeTruthy());
    expect(screen.getByText('Add hello.txt')).toBeTruthy();
    expect(screen.getByText(/hello.txt written/)).toBeTruthy();
  });

  it('shows a failed result when the orchestrator reports success: false', async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          plan: FAKE_PLAN,
          result: {
            plan: FAKE_PLAN,
            results: [{ role: 'coding', success: false, output: 'exitCode=1' }],
            success: false,
          },
        }),
        { status: 200 },
      ),
    ) as unknown as typeof fetch;

    render(<HomePage />);
    submitIntent('add hello.txt');

    await waitFor(() => expect(screen.getByText('Échec')).toBeTruthy());
  });

  it('shows an error message when the API call fails', async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response(JSON.stringify({ message: 'Internal server error' }), { status: 500 }),
    ) as unknown as typeof fetch;

    render(<HomePage />);
    submitIntent('add hello.txt');

    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    expect(screen.getByText(/Internal server error/)).toBeTruthy();
  });

  it('does not submit an empty intent', () => {
    render(<HomePage />);
    const button = screen.getByRole('button', { name: /Envoyer/ });
    expect(button.hasAttribute('disabled')).toBe(true);
  });
});
