import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Chat from './Chat';

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

function renderChat(overrides: Partial<Parameters<typeof Chat>[0]> = {}) {
  const onLogout = vi.fn();
  const onUnauthorized = vi.fn();
  render(<Chat token="fake-token" onLogout={onLogout} onUnauthorized={onUnauthorized} {...overrides} />);
  return { onLogout, onUnauthorized };
}

describe('Chat', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    cleanup();
  });

  it('renders the heading and the empty state before any submission', () => {
    renderChat();
    expect(screen.getByRole('heading', { name: 'Naminto IA' })).toBeTruthy();
    expect(screen.getByText(/Aucune demande envoyée/)).toBeTruthy();
  });

  it('sends the bearer token on every /plan request', async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            plan: FAKE_PLAN,
            result: { plan: FAKE_PLAN, results: [{ role: 'coding', success: true, output: 'ok' }], success: true },
          }),
          { status: 200 },
        ),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    renderChat();
    submitIntent('add hello.txt');

    await waitFor(() => expect(screen.getByText('Succès')).toBeTruthy());
    const call = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const requestInit = call[1];
    expect((requestInit.headers as Record<string, string>).authorization).toBe('Bearer fake-token');
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

    renderChat();
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

    renderChat();
    submitIntent('add hello.txt');

    await waitFor(() => expect(screen.getByText('Échec')).toBeTruthy());
  });

  it('shows an error message when the API call fails', async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response(JSON.stringify({ message: 'Internal server error' }), { status: 500 }),
    ) as unknown as typeof fetch;

    renderChat();
    submitIntent('add hello.txt');

    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    expect(screen.getByText(/Internal server error/)).toBeTruthy();
  });

  it('calls onUnauthorized instead of showing an error when the session is rejected', async () => {
    globalThis.fetch = vi.fn(async () => new Response(null, { status: 401 })) as unknown as typeof fetch;

    const { onUnauthorized } = renderChat();
    submitIntent('add hello.txt');

    await waitFor(() => expect(onUnauthorized).toHaveBeenCalledTimes(1));
  });

  it('calls onLogout when the logout button is clicked', () => {
    const { onLogout } = renderChat();
    fireEvent.click(screen.getByRole('button', { name: /déconnecter/ }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('does not submit an empty intent', () => {
    renderChat();
    const button = screen.getByRole('button', { name: /Envoyer/ });
    expect(button.hasAttribute('disabled')).toBe(true);
  });
});
