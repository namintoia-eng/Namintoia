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

const FAKE_TURN = {
  id: 'turn-1',
  projectId: 'proj-1',
  intent: 'add goodbye.txt',
  createdAt: '2026-08-22T00:00:00.000Z',
  plan: FAKE_PLAN,
  result: { plan: FAKE_PLAN, results: [{ role: 'coding', success: true, output: 'goodbye.txt written' }], success: true },
};

function mockFetchByUrl(responses: {
  post?: Response;
  history?: Response;
  files?: Response;
  fileContent?: Response;
}) {
  return vi.fn(async (url: string, init?: RequestInit) => {
    const method = init?.method ?? 'GET';
    if (method === 'POST' && url.endsWith('/plan')) {
      return (
        responses.post ??
        new Response(
          JSON.stringify({
            plan: FAKE_PLAN,
            result: { plan: FAKE_PLAN, results: [{ role: 'coding', success: true, output: 'ok' }], success: true },
          }),
          { status: 200 },
        )
      );
    }
    if (url.includes('/file?path=')) {
      return responses.fileContent ?? new Response(JSON.stringify({ path: 'x', content: '' }), { status: 200 });
    }
    if (url.endsWith('/files')) {
      return responses.files ?? new Response(JSON.stringify({ files: [] }), { status: 200 });
    }
    return responses.history ?? new Response(JSON.stringify({ turns: [] }), { status: 200 });
  });
}

function setFetch(mock: ReturnType<typeof mockFetchByUrl>): typeof mock {
  globalThis.fetch = mock as unknown as typeof fetch;
  return mock;
}

function submitIntent(text: string): void {
  fireEvent.change(screen.getByPlaceholderText(/Ex :/), { target: { value: text } });
  fireEvent.click(screen.getByRole('button', { name: /Envoyer/ }));
}

function renderChat(overrides: Partial<Parameters<typeof Chat>[0]> = {}) {
  const onLogout = vi.fn();
  const onUnauthorized = vi.fn();
  const onBackToProjects = vi.fn();
  render(
    <Chat
      token="fake-token"
      projectId="proj-1"
      projectName="Test Project"
      onBackToProjects={onBackToProjects}
      onLogout={onLogout}
      onUnauthorized={onUnauthorized}
      {...overrides}
    />,
  );
  return { onLogout, onUnauthorized, onBackToProjects };
}

describe('Chat', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    cleanup();
  });

  it('renders the heading with the project name and the empty state before any submission', async () => {
    setFetch(mockFetchByUrl({}));
    renderChat();
    expect(screen.getByRole('heading', { name: /Naminto IA — Test Project/ })).toBeTruthy();
    expect(screen.getByText(/Aucune demande envoyée/)).toBeTruthy();
    await waitFor(() => expect(screen.getByText(/Aucune demande dans l'historique/)).toBeTruthy());
  });

  it('sends the bearer token on every /plan request', async () => {
    const fetchMock = setFetch(mockFetchByUrl({}));

    renderChat();
    submitIntent('add hello.txt');

    await waitFor(() => expect(screen.getByText('Succès')).toBeTruthy());
    const postCall = fetchMock.mock.calls.find(
      (call) => (call[1] as RequestInit | undefined)?.method === 'POST',
    ) as unknown as [string, RequestInit];
    const requestInit = postCall[1];
    expect((requestInit.headers as Record<string, string>).authorization).toBe('Bearer fake-token');
    expect(JSON.parse(requestInit.body as string)).toEqual({
      intent: 'add hello.txt',
      projectId: 'proj-1',
    });
  });

  it('shows the plan and a successful result after submitting', async () => {
    setFetch(mockFetchByUrl({
      post: new Response(
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
    }));

    renderChat();
    submitIntent('add hello.txt');

    await waitFor(() => expect(screen.getByText('Succès')).toBeTruthy());
    expect(screen.getByText('Add hello.txt')).toBeTruthy();
    expect(screen.getByText(/hello.txt written/)).toBeTruthy();
  });

  it('shows a failed result when the orchestrator reports success: false', async () => {
    setFetch(mockFetchByUrl({
      post: new Response(
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
    }));

    renderChat();
    submitIntent('add hello.txt');

    await waitFor(() => expect(screen.getByText('Échec')).toBeTruthy());
  });

  it('shows an error message when the API call fails', async () => {
    setFetch(mockFetchByUrl({
      post: new Response(JSON.stringify({ message: 'Internal server error' }), { status: 500 }),
    }));

    renderChat();
    submitIntent('add hello.txt');

    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    expect(screen.getByText(/Internal server error/)).toBeTruthy();
  });

  it('calls onUnauthorized instead of showing an error when the session is rejected', async () => {
    setFetch(mockFetchByUrl({ post: new Response(null, { status: 401 }) }));

    const { onUnauthorized } = renderChat();
    submitIntent('add hello.txt');

    await waitFor(() => expect(onUnauthorized).toHaveBeenCalledTimes(1));
  });

  it('calls onLogout when the logout button is clicked', async () => {
    setFetch(mockFetchByUrl({}));
    const { onLogout } = renderChat();
    fireEvent.click(screen.getByRole('button', { name: /déconnecter/ }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('calls onBackToProjects when the back-to-projects button is clicked', async () => {
    setFetch(mockFetchByUrl({}));
    const { onBackToProjects } = renderChat();
    fireEvent.click(screen.getByRole('button', { name: /Projets/ }));
    expect(onBackToProjects).toHaveBeenCalledTimes(1);
  });

  it('does not submit an empty intent', async () => {
    setFetch(mockFetchByUrl({}));
    renderChat();
    const button = screen.getByRole('button', { name: /Envoyer/ });
    expect(button.hasAttribute('disabled')).toBe(true);
  });

  describe('history', () => {
    it('shows past turns fetched on mount, most recent first', async () => {
      setFetch(mockFetchByUrl({
        history: new Response(JSON.stringify({ turns: [FAKE_TURN] }), { status: 200 }),
      }));

      renderChat();

      await waitFor(() => expect(screen.getByText('add goodbye.txt')).toBeTruthy());
    });

    it("expanding a turn shows its plan and result", async () => {
      setFetch(mockFetchByUrl({
        history: new Response(JSON.stringify({ turns: [FAKE_TURN] }), { status: 200 }),
      }));

      renderChat();
      await waitFor(() => expect(screen.getByText('add goodbye.txt')).toBeTruthy());

      fireEvent.click(screen.getByText('add goodbye.txt'));

      expect(screen.getByText(/goodbye.txt written/)).toBeTruthy();
    });

    it('refreshes after a successful submission', async () => {
      const fetchMock = setFetch(mockFetchByUrl({
        history: new Response(JSON.stringify({ turns: [] }), { status: 200 }),
      }));

      renderChat();
      await waitFor(() => expect(screen.getByText(/Aucune demande dans l'historique/)).toBeTruthy());

      submitIntent('add hello.txt');
      await waitFor(() => expect(screen.getByText('Succès')).toBeTruthy());

      const historyCalls = fetchMock.mock.calls.filter(
        (call) => (call[1] as RequestInit | undefined)?.method !== 'POST' && !call[0].toString().includes('/files'),
      );
      expect(historyCalls.length).toBeGreaterThan(1);
    });
  });

  describe('files', () => {
    it('shows the files fetched on mount', async () => {
      setFetch(mockFetchByUrl({
        files: new Response(JSON.stringify({ files: ['hello.txt'] }), { status: 200 }),
      }));

      renderChat();

      await waitFor(() => expect(screen.getByText('hello.txt')).toBeTruthy());
    });

    it('shows an empty state when there are no files', async () => {
      setFetch(mockFetchByUrl({}));
      renderChat();
      await waitFor(() => expect(screen.getByText(/Aucun fichier pour l'instant/)).toBeTruthy());
    });

    it('shows a file\'s content when clicked, and hides it on a second click', async () => {
      setFetch(mockFetchByUrl({
        files: new Response(JSON.stringify({ files: ['hello.txt'] }), { status: 200 }),
        fileContent: new Response(JSON.stringify({ path: 'hello.txt', content: 'Hello!' }), { status: 200 }),
      }));

      renderChat();
      await waitFor(() => expect(screen.getByText('hello.txt')).toBeTruthy());

      fireEvent.click(screen.getByText('hello.txt'));
      await waitFor(() => expect(screen.getByText('Hello!')).toBeTruthy());

      fireEvent.click(screen.getByText('hello.txt'));
      expect(screen.queryByText('Hello!')).toBeNull();
    });
  });
});
