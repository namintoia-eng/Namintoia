import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, normalize, relative, resolve, sep } from 'node:path';
import type { FileSystem, ProjectFile } from '@namintoia/naminto-core';

export interface LocalFileSystemConfig {
  baseDir?: string;
}

/**
 * Default FileSystem adapter (DECISIONS.md D-12 MVP): stores each project's
 * captured files under baseDir/<projectId>/, no external storage required —
 * the sandbox itself is destroyed at the end of a Plan run, so this is what
 * makes generated files survive past that. saveProjectFiles replaces the
 * previous snapshot rather than merging across runs, since sandbox sessions
 * don't resume previous state across Plan runs yet either (see D-12).
 */
export class LocalFileSystem implements FileSystem {
  readonly name = 'local';

  private readonly baseDir: string;

  constructor(config: LocalFileSystemConfig = {}) {
    this.baseDir = config.baseDir ?? process.env['FILE_SYSTEM_DIR'] ?? '.naminto/files';
  }

  async saveProjectFiles(projectId: string, files: ProjectFile[]): Promise<void> {
    const projectDir = this.projectDir(projectId);
    await rm(projectDir, { recursive: true, force: true });

    for (const file of files) {
      const target = this.resolveProjectPath(projectId, file.path);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, file.content, 'utf8');
    }
  }

  async listProjectFiles(projectId: string): Promise<string[]> {
    const projectDir = this.projectDir(projectId);
    const paths: string[] = [];
    await this.collectFiles(projectDir, projectDir, paths);
    return paths;
  }

  async readProjectFile(projectId: string, path: string): Promise<string> {
    return readFile(this.resolveProjectPath(projectId, path), 'utf8');
  }

  private projectDir(projectId: string): string {
    return resolve(join(this.baseDir, encodeURIComponent(projectId)));
  }

  private resolveProjectPath(projectId: string, filePath: string): string {
    const projectDir = this.projectDir(projectId);
    const target = resolve(projectDir, normalize(filePath));
    if (target !== projectDir && !target.startsWith(projectDir + sep)) {
      throw new Error(
        `LocalFileSystem: refusing to write outside the project directory: "${filePath}".`,
      );
    }
    return target;
  }

  private async collectFiles(dir: string, projectDir: string, out: string[]): Promise<void> {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch (error) {
      if (isNotFoundError(error)) {
        return;
      }
      throw error;
    }

    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        await this.collectFiles(full, projectDir, out);
      } else {
        out.push(relative(projectDir, full).split(sep).join('/'));
      }
    }
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
