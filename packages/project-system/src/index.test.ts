import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LocalProjectSystem } from './index.js';

describe('LocalProjectSystem', () => {
  let baseDir: string;
  let projectSystem: LocalProjectSystem;

  beforeEach(async () => {
    baseDir = await mkdtemp(join(tmpdir(), 'naminto-projects-'));
    projectSystem = new LocalProjectSystem({ baseDir });
  });

  afterEach(async () => {
    await rm(baseDir, { recursive: true, force: true });
  });

  it('creates a project with an id, owner, name and creation date', async () => {
    const project = await projectSystem.createProject('user-a', 'Website Refresh');

    expect(project.id).toBeTruthy();
    expect(project.ownerId).toBe('user-a');
    expect(project.name).toBe('Website Refresh');
    expect(project.createdAt).toBeTruthy();
  });

  it('lists only the projects owned by the given user', async () => {
    await projectSystem.createProject('user-a', 'A1');
    await projectSystem.createProject('user-a', 'A2');
    await projectSystem.createProject('user-b', 'B1');

    const aProjects = await projectSystem.listProjects('user-a');
    expect(aProjects.map((p) => p.name).sort()).toEqual(['A1', 'A2']);

    const bProjects = await projectSystem.listProjects('user-b');
    expect(bProjects.map((p) => p.name)).toEqual(['B1']);
  });

  it('gets a project by id for its owner', async () => {
    const created = await projectSystem.createProject('user-a', 'Website Refresh');

    const found = await projectSystem.getProject('user-a', created.id);

    expect(found).toEqual(created);
  });

  it('returns null for an unknown project id', async () => {
    expect(await projectSystem.getProject('user-a', 'does-not-exist')).toBeNull();
  });

  it('returns null when the project exists but belongs to a different owner', async () => {
    const created = await projectSystem.createProject('user-a', 'Website Refresh');

    expect(await projectSystem.getProject('user-b', created.id)).toBeNull();
  });

  it('does not lose creations made concurrently', async () => {
    await Promise.all([
      projectSystem.createProject('user-a', 'P1'),
      projectSystem.createProject('user-a', 'P2'),
      projectSystem.createProject('user-a', 'P3'),
    ]);

    const projects = await projectSystem.listProjects('user-a');
    expect(projects.map((p) => p.name).sort()).toEqual(['P1', 'P2', 'P3']);
  });

  describe('renameProject', () => {
    it('renames a project owned by the given user', async () => {
      const created = await projectSystem.createProject('user-a', 'Old Name');

      const renamed = await projectSystem.renameProject('user-a', created.id, 'New Name');

      expect(renamed.name).toBe('New Name');
      expect((await projectSystem.getProject('user-a', created.id))?.name).toBe('New Name');
    });

    it('throws when renaming an unknown project', async () => {
      await expect(projectSystem.renameProject('user-a', 'does-not-exist', 'x')).rejects.toThrow();
    });

    it("throws when renaming another owner's project", async () => {
      const created = await projectSystem.createProject('user-a', 'Old Name');
      await expect(projectSystem.renameProject('user-b', created.id, 'New Name')).rejects.toThrow();
    });
  });

  describe('deleteProject', () => {
    it('removes a project owned by the given user', async () => {
      const created = await projectSystem.createProject('user-a', 'Website Refresh');

      await projectSystem.deleteProject('user-a', created.id);

      expect(await projectSystem.getProject('user-a', created.id)).toBeNull();
    });

    it("does not affect another owner's projects", async () => {
      const ownedByA = await projectSystem.createProject('user-a', 'A1');
      const ownedByB = await projectSystem.createProject('user-b', 'B1');

      await projectSystem.deleteProject('user-a', ownedByA.id);

      expect(await projectSystem.getProject('user-b', ownedByB.id)).toEqual(ownedByB);
    });

    it('does not throw when deleting an unknown project', async () => {
      await expect(projectSystem.deleteProject('user-a', 'does-not-exist')).resolves.toBeUndefined();
    });
  });
});
