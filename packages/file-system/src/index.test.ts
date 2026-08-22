import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LocalFileSystem } from './index.js';

describe('LocalFileSystem', () => {
  let baseDir: string;
  let fileSystem: LocalFileSystem;

  beforeEach(async () => {
    baseDir = await mkdtemp(join(tmpdir(), 'naminto-files-'));
    fileSystem = new LocalFileSystem({ baseDir });
  });

  afterEach(async () => {
    await rm(baseDir, { recursive: true, force: true });
  });

  it('returns an empty list for a project with no saved files', async () => {
    expect(await fileSystem.listProjectFiles('unknown')).toEqual([]);
  });

  it('saves files and lists them back, including nested paths', async () => {
    await fileSystem.saveProjectFiles('p1', [
      { path: 'index.ts', content: 'export {}' },
      { path: 'src/lib/util.ts', content: 'export const x = 1;' },
    ]);

    const paths = (await fileSystem.listProjectFiles('p1')).sort();
    expect(paths).toEqual(['index.ts', 'src/lib/util.ts']);
  });

  it('reads back the exact content of a saved file', async () => {
    await fileSystem.saveProjectFiles('p1', [{ path: 'hello.txt', content: 'Hello from Naminto' }]);

    expect(await fileSystem.readProjectFile('p1', 'hello.txt')).toBe('Hello from Naminto');
  });

  it('replaces the previous snapshot instead of merging across saves', async () => {
    await fileSystem.saveProjectFiles('p1', [{ path: 'old.txt', content: 'old' }]);
    await fileSystem.saveProjectFiles('p1', [{ path: 'new.txt', content: 'new' }]);

    expect(await fileSystem.listProjectFiles('p1')).toEqual(['new.txt']);
  });

  it('keeps different projects in separate directories', async () => {
    await fileSystem.saveProjectFiles('p1', [{ path: 'a.txt', content: 'a' }]);
    await fileSystem.saveProjectFiles('p2', [{ path: 'b.txt', content: 'b' }]);

    expect(await fileSystem.listProjectFiles('p1')).toEqual(['a.txt']);
    expect(await fileSystem.listProjectFiles('p2')).toEqual(['b.txt']);
  });

  it('refuses to write outside the project directory', async () => {
    await expect(
      fileSystem.saveProjectFiles('p1', [{ path: '../../evil.txt', content: 'x' }]),
    ).rejects.toThrow(/refusing to write outside/);
  });

  describe('deleteProject', () => {
    it("removes a project's files", async () => {
      await fileSystem.saveProjectFiles('p1', [{ path: 'hello.txt', content: 'hi' }]);

      await fileSystem.deleteProject('p1');

      expect(await fileSystem.listProjectFiles('p1')).toEqual([]);
    });

    it('does not affect other projects', async () => {
      await fileSystem.saveProjectFiles('p1', [{ path: 'a.txt', content: 'a' }]);
      await fileSystem.saveProjectFiles('p2', [{ path: 'b.txt', content: 'b' }]);

      await fileSystem.deleteProject('p1');

      expect(await fileSystem.listProjectFiles('p2')).toEqual(['b.txt']);
    });

    it('does not throw for a project with no saved files', async () => {
      await expect(fileSystem.deleteProject('unknown')).resolves.toBeUndefined();
    });
  });
});
