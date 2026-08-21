export interface Project {
  id: string;
  ownerId: string;
  name: string;
  createdAt: string;
}

/**
 * Named-project management (GLOSSARY.md: Project System). MVP scope
 * (DECISIONS.md D-16): a project must be created explicitly before it can
 * be used with `/plan` — replaces the implicit free-form projectId that
 * D-14 only isolated by prefixing, never actually validated. `getProject`
 * returns `null` both when a project doesn't exist and when it exists but
 * isn't owned by the given user — same no-enumeration philosophy as
 * `UserSystem.authenticate` (D-13).
 */
export interface ProjectSystem {
  readonly name: string;
  createProject(ownerId: string, name: string): Promise<Project>;
  listProjects(ownerId: string): Promise<Project[]>;
  getProject(ownerId: string, projectId: string): Promise<Project | null>;
}
