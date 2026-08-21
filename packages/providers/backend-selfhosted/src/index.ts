import type {
  BackendProvider,
  BackendProvisionRequest,
  BackendProvisionResult,
} from '@namintoia/naminto-core';

export interface SelfHostedBackendProviderConfig {
  databaseUrl?: string;
  authServiceUrl?: string;
  storageServiceUrl?: string;
}

/**
 * Default BackendProvider adapter (DECISIONS.md D-4): self-hosted open-source
 * stack (Postgres + GoTrue-style auth + PostgREST-style API), never a
 * proprietary SaaS. MVP scope: one shared instance's URLs, not yet
 * per-project auto-provisioning — that's future work once real infra exists.
 */
export class SelfHostedBackendProvider implements BackendProvider {
  readonly name = 'self-hosted';

  constructor(private readonly config: SelfHostedBackendProviderConfig = {}) {}

  private resolve(value: string | undefined, envVar: string): string {
    const resolved = value ?? process.env[envVar];
    if (!resolved) {
      throw new Error(`SelfHostedBackendProvider: ${envVar} is not configured (see .env.example).`);
    }
    return resolved;
  }

  async provisionProjectBackend(
    _request: BackendProvisionRequest,
  ): Promise<BackendProvisionResult> {
    return {
      databaseUrl: this.resolve(this.config.databaseUrl, 'DATABASE_URL'),
      authServiceUrl: this.resolve(this.config.authServiceUrl, 'AUTH_SERVICE_URL'),
      storageServiceUrl: this.resolve(this.config.storageServiceUrl, 'STORAGE_SERVICE_URL'),
    };
  }

  async teardownProjectBackend(_projectId: string): Promise<void> {
    // No-op: MVP shares one self-hosted instance rather than provisioning
    // per-project infrastructure, so there is nothing to tear down yet.
  }
}
