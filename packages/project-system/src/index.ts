import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Project, ProjectSystem } from '@namintoia/naminto-core';

interface StoredProject {
  id: string;
  ownerId: string;
  name: string;
  createdAt: string;
}

export interface LocalProjectSystemConfig {
  baseDir?: string;
}

/**
 * Default ProjectSystem adapter (DECISIONS.md D-16): file-based projects,
 * same "don't block on infra that isn't provisioned yet" reasoning as
 * Memory System (D-10), File System (D-12), and User System (D-13). Writes
 * are serialized through one in-process queue to avoid read-modify-write
 * races between near-simultaneous project creations.
 */
export class LocalProjectSystem implements ProjectSystem {
  readonly name = 'local';

  private readonly baseDir: string;
  private queue: Promise<unknown> = Promise.resolve();

  constructor(config: LocalProjectSystemConfig = {}) {
    this.baseDir = config.baseDir ?? process.env['PROJECT_SYSTEM_DIR'] ?? '.naminto/projects';
  }

  async createProject(ownerId: string, name: string): Promise<Project> {
    return this.runExclusive(async () => {
      const projects = await this.readJson();

      const stored: StoredProject = {
        id: randomUUID(),
        ownerId,
        name,
        createdAt: new Date().toISOString(),
      };

      projects.push(stored);
      await this.writeJson(projects);

      return stored;
    });
  }

  async listProjects(ownerId: string): Promise<Project[]> {
    const projects = await this.readJson();
    return projects.filter((project) => project.ownerId === ownerId);
  }

  async getProject(ownerId: string, projectId: string): Promise<Project | null> {
    const projects = await this.readJson();
    const project = projects.find((p) => p.id === projectId && p.ownerId === ownerId);
    return project ?? null;
  }

  private runExclusive<T>(fn: () => Promise<T>): Promise<T> {
    const run = this.queue.then(fn, fn);
    this.queue = run.catch(() => undefined);
    return run;
  }

  private async readJson(): Promise<StoredProject[]> {
    try {
      const raw = await readFile(join(this.baseDir, 'projects.json'), 'utf8');
      return JSON.parse(raw) as StoredProject[];
    } catch (error) {
      if (isNotFoundError(error)) {
        return [];
      }
      throw error;
    }
  }

  private async writeJson(data: StoredProject[]): Promise<void> {
    await mkdir(this.baseDir, { recursive: true });
    await writeFile(join(this.baseDir, 'projects.json'), JSON.stringify(data, null, 2), 'utf8');
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
