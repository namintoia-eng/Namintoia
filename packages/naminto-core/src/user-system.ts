export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface Session {
  token: string;
  userId: string;
  expiresAt: string;
}

/**
 * An identity confirmed by an external OAuth2/OIDC provider (DECISIONS.md
 * D-18 — Google is the first). Caller contract: only construct this after
 * the provider has confirmed the caller owns `email` (e.g. Google's
 * `verified_email: true`) — UserSystem trusts this email completely, it
 * never re-verifies it.
 */
export interface ExternalIdentity {
  provider: string;
  externalId: string;
  email: string;
}

/**
 * Account/identity management (GLOSSARY.md: User System). MVP scope
 * (DECISIONS.md D-2/D-13): simple email+password auth with opaque session
 * tokens, not the OAuth2/OIDC+JWT stack STACK.md ultimately targets — no
 * external identity provider is set up yet, same limitation as
 * BackendProvider (D-4). This interface is what a future OAuth2/OIDC
 * implementation would satisfy without callers changing.
 *
 * `authenticateExternal` (D-18) extends this without breaking that
 * promise: it stays provider-neutral (`ExternalIdentity.provider` is a
 * plain string, never a vendor-specific type) — Google-specific mechanics
 * live in apps/api/src/auth/, not here.
 */
export interface UserSystem {
  readonly name: string;
  register(email: string, password: string): Promise<User>;
  authenticate(email: string, password: string): Promise<Session>;
  authenticateExternal(identity: ExternalIdentity): Promise<Session>;
  verifySession(token: string): Promise<User | null>;
}
