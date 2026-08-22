import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ConversationTurn, MemoryStore, NewConversationTurn } from '@namintoia/naminto-core';

export interface FileMemoryStoreConfig {
  baseDir?: string;
}

/**
 * Default MemoryStore adapter (DECISIONS.md D-2 MVP: simple persistence,
 * no semantic search). One JSON file per project under baseDir — no
 * external database required, so it works before BackendProvider has real
 * infra provisioned. Writes are serialized per project (an in-process
 * queue) to avoid a read-modify-write race between two near-simultaneous
 * saveTurn calls; this only protects a single process, not multiple — a
 * real database is what would be needed for that.
 */
export class FileMemoryStore implements MemoryStore {
  readonly name = 'file';

  private readonly baseDir: string;
  private readonly queues = new Map<string, Promise<unknown>>();

  constructor(config: FileMemoryStoreConfig = {}) {
    this.baseDir = config.baseDir ?? process.env['MEMORY_STORE_DIR'] ?? '.naminto/memory';
  }

  async saveTurn(turn: NewConversationTurn): Promise<ConversationTurn> {
    return this.runExclusive(turn.projectId, async () => {
      const saved: ConversationTurn = {
        ...turn,
        id: randomUUID(),
        createdAt: new Date().toISOString(),
      };

      const turns = await this.readProjectFile(turn.projectId);
      turns.push(saved);
      await this.writeProjectFile(turn.projectId, turns);

      return saved;
    });
  }

  async listTurns(projectId: string): Promise<ConversationTurn[]> {
    return this.readProjectFile(projectId);
  }

  async deleteProject(projectId: string): Promise<void> {
    return this.runExclusive(projectId, async () => {
      await rm(this.projectFilePath(projectId), { force: true });
    });
  }

  private runExclusive<T>(projectId: string, fn: () => Promise<T>): Promise<T> {
    const previous = this.queues.get(projectId) ?? Promise.resolve();
    const run = previous.then(fn, fn);
    this.queues.set(
      projectId,
      run.catch(() => undefined),
    );
    return run;
  }

  private projectFilePath(projectId: string): string {
    return join(this.baseDir, `${encodeURIComponent(projectId)}.json`);
  }

  private async readProjectFile(projectId: string): Promise<ConversationTurn[]> {
    try {
      const raw = await readFile(this.projectFilePath(projectId), 'utf8');
      return JSON.parse(raw) as ConversationTurn[];
    } catch (error) {
      if (isNotFoundError(error)) {
        return [];
      }
      throw error;
    }
  }

  private async writeProjectFile(projectId: string, turns: ConversationTurn[]): Promise<void> {
    await mkdir(this.baseDir, { recursive: true });
    await writeFile(this.projectFilePath(projectId), JSON.stringify(turns, null, 2), 'utf8');
  }
}

function isNotFoundError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === 'ENOENT'
  );
}
