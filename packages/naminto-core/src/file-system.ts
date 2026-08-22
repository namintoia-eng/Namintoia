export interface ProjectFile {
  path: string;
  content: string;
}

/**
 * Durable storage for the files a Plan run produced — the sandbox itself is
 * destroyed once a run finishes (SandboxSession.close()), so anything worth
 * keeping has to be captured here first (DECISIONS.md D-12). MVP scope: the
 * default implementation replaces a project's stored snapshot on every
 * saveProjectFiles call rather than merging across runs, since sandbox
 * sessions don't resume previous state yet either — see D-12.
 */
export interface FileSystem {
  readonly name: string;
  saveProjectFiles(projectId: string, files: ProjectFile[]): Promise<void>;
  listProjectFiles(projectId: string): Promise<string[]>;
  readProjectFile(projectId: string, path: string): Promise<string>;
  deleteProject(projectId: string): Promise<void>;
}
