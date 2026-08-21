import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { NewConversationTurn } from '@namintoia/naminto-core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FileMemoryStore } from './index.js';

const FAKE_PLAN = {
  intent: 'add hello.txt',
  spec: {
    objective: 'Add hello.txt',
    requirements: { functional: [], nonFunctional: [], constraints: [] },
    architecture: { modulesInvolved: [], newInterfaces: [] },
    components: [],
    interfaces: [],
  },
  tasks: [{ agentRole: 'coding' as const, instruction: 'write hello.txt' }],
};

function newTurn(projectId: string, intent: string): NewConversationTurn {
  return {
    projectId,
    intent,
    plan: { ...FAKE_PLAN, intent },
    result: {
      plan: { ...FAKE_PLAN, intent },
      results: [{ role: 'coding', success: true, output: 'ok' }],
      success: true,
    },
  };
}

describe('FileMemoryStore', () => {
  let baseDir: string;
  let store: FileMemoryStore;

  beforeEach(async () => {
    baseDir = await mkdtemp(join(tmpdir(), 'naminto-memory-'));
    store = new FileMemoryStore({ baseDir });
  });

  afterEach(async () => {
    await rm(baseDir, { recursive: true, force: true });
  });

  it('returns an empty list for a project with no history', async () => {
    expect(await store.listTurns('unknown-project')).toEqual([]);
  });

  it('saves a turn and assigns it an id and a timestamp', async () => {
    const saved = await store.saveTurn(newTurn('p1', 'add hello.txt'));

    expect(saved.id).toBeTruthy();
    expect(saved.createdAt).toBeTruthy();
    expect(saved.intent).toBe('add hello.txt');

    const turns = await store.listTurns('p1');
    expect(turns).toEqual([saved]);
  });

  it('appends turns instead of overwriting previous ones', async () => {
    await store.saveTurn(newTurn('p1', 'first'));
    await store.saveTurn(newTurn('p1', 'second'));

    const turns = await store.listTurns('p1');
    expect(turns.map((t) => t.intent)).toEqual(['first', 'second']);
  });

  it('keeps different projects separate', async () => {
    await store.saveTurn(newTurn('p1', 'p1 intent'));
    await store.saveTurn(newTurn('p2', 'p2 intent'));

    expect((await store.listTurns('p1')).map((t) => t.intent)).toEqual(['p1 intent']);
    expect((await store.listTurns('p2')).map((t) => t.intent)).toEqual(['p2 intent']);
  });

  it('does not drop turns saved concurrently for the same project', async () => {
    await Promise.all([
      store.saveTurn(newTurn('p1', 'a')),
      store.saveTurn(newTurn('p1', 'b')),
      store.saveTurn(newTurn('p1', 'c')),
    ]);

    const turns = await store.listTurns('p1');
    expect(turns.map((t) => t.intent).sort()).toEqual(['a', 'b', 'c']);
  });
});
