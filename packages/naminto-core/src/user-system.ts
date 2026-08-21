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
 * Account/identity management (GLOSSARY.md: User System). MVP scope
 * (DECISIONS.md D-2/D-13): simple email+password auth with opaque session
 * tokens, not the OAuth2/OIDC+JWT stack STACK.md ultimately targets — no
 * external identity provider is set up yet, same limitation as
 * BackendProvider (D-4). This interface is what a future OAuth2/OIDC
 * implementation would satisfy without callers changing.
 */
export interface UserSystem {
  readonly name: string;
  register(email: string, password: string): Promise<User>;
  authenticate(email: string, password: string): Promise<Session>;
  verifySession(token: string): Promise<User | null>;
}
