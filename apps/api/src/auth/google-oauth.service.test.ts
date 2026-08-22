import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GoogleOAuthService } from './google-oauth.service.js';

function setEnv(overrides: Record<string, string | undefined> = {}): void {
  const defaults: Record<string, string> = {
    GOOGLE_CLIENT_ID: 'client-id',
    GOOGLE_CLIENT_SECRET: 'client-secret',
    AUTH_STATE_SECRET: 'state-secret',
    API_URL: 'http://localhost:3001',
  };
  for (const [key, value] of Object.entries({ ...defaults, ...overrides })) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

describe('GoogleOAuthService', () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = { ...process.env };
  let service: GoogleOAuthService;

  beforeEach(() => {
    service = new GoogleOAuthService();
    setEnv();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.env = { ...originalEnv };
    vi.useRealTimers();
  });

  describe('config', () => {
    it('throws a clear error when GOOGLE_CLIENT_ID is missing', () => {
      setEnv({ GOOGLE_CLIENT_ID: undefined });
      expect(() => service.buildAuthorizationUrl()).toThrow(/GOOGLE_CLIENT_ID/);
    });

    it('throws a clear error when AUTH_STATE_SECRET is missing', () => {
      setEnv({ AUTH_STATE_SECRET: undefined });
      expect(() => service.buildAuthorizationUrl()).toThrow(/AUTH_STATE_SECRET/);
    });
  });

  describe('buildAuthorizationUrl', () => {
    it('builds a Google authorization URL with the expected params', () => {
      const url = new URL(service.buildAuthorizationUrl());

      expect(url.origin + url.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth');
      expect(url.searchParams.get('client_id')).toBe('client-id');
      expect(url.searchParams.get('redirect_uri')).toBe('http://localhost:3001/auth/google/callback');
      expect(url.searchParams.get('response_type')).toBe('code');
      expect(url.searchParams.get('scope')).toBe('openid email profile');
      expect(url.searchParams.get('state')).toBeTruthy();
    });
  });

  describe('verifyState', () => {
    it('accepts a freshly signed state', () => {
      const url = new URL(service.buildAuthorizationUrl());
      const state = url.searchParams.get('state') ?? '';
      expect(service.verifyState(state)).toBe(true);
    });

    it('rejects a missing state', () => {
      expect(service.verifyState(undefined)).toBe(false);
    });

    it('rejects a tampered state', () => {
      const url = new URL(service.buildAuthorizationUrl());
      const state = url.searchParams.get('state') ?? '';
      const tampered = state.slice(0, -1) + (state.at(-1) === 'a' ? 'b' : 'a');
      expect(service.verifyState(tampered)).toBe(false);
    });

    it('rejects a malformed state', () => {
      expect(service.verifyState('not-a-valid-state')).toBe(false);
    });

    it('rejects an expired state', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-08-22T00:00:00.000Z'));
      const url = new URL(service.buildAuthorizationUrl());
      const state = url.searchParams.get('state') ?? '';

      vi.setSystemTime(new Date('2026-08-22T00:11:00.000Z'));
      expect(service.verifyState(state)).toBe(false);
    });
  });

  describe('exchangeCode', () => {
    it('exchanges a code for a verified Google identity', async () => {
      globalThis.fetch = vi.fn(async (url: string) => {
        if (url.toString().includes('oauth2.googleapis.com/token')) {
          return new Response(JSON.stringify({ access_token: 'access-token' }), { status: 200 });
        }
        return new Response(
          JSON.stringify({ id: 'google-sub-1', email: 'alice@example.com', verified_email: true }),
          { status: 200 },
        );
      }) as unknown as typeof fetch;

      const identity = await service.exchangeCode('auth-code');

      expect(identity).toEqual({ externalId: 'google-sub-1', email: 'alice@example.com' });
    });

    it('rejects an unverified Google email', async () => {
      globalThis.fetch = vi.fn(async (url: string) => {
        if (url.toString().includes('oauth2.googleapis.com/token')) {
          return new Response(JSON.stringify({ access_token: 'access-token' }), { status: 200 });
        }
        return new Response(
          JSON.stringify({ id: 'google-sub-1', email: 'alice@example.com', verified_email: false }),
          { status: 200 },
        );
      }) as unknown as typeof fetch;

      await expect(service.exchangeCode('auth-code')).rejects.toThrow(/not verified/);
    });

    it('throws when the token exchange fails', async () => {
      globalThis.fetch = vi.fn(
        async () => new Response(JSON.stringify({ error: 'invalid_grant' }), { status: 400 }),
      ) as unknown as typeof fetch;

      await expect(service.exchangeCode('auth-code')).rejects.toThrow(/token exchange failed/);
    });
  });
});
