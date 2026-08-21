export interface BackendProvisionRequest {
  projectId: string;
  displayName: string;
}

export interface BackendProvisionResult {
  databaseUrl: string;
  authServiceUrl: string;
  storageServiceUrl: string;
  realtimeChannelUrl?: string;
}

/**
 * Backend (db/auth/storage/realtime) provisioned for one *generated* user project.
 * Default: self-hosted open-source stack, not a proprietary SaaS (DECISIONS.md D-4).
 */
export interface BackendProvider {
  readonly name: string;
  provisionProjectBackend(request: BackendProvisionRequest): Promise<BackendProvisionResult>;
  teardownProjectBackend(projectId: string): Promise<void>;
}
