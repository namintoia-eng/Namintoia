import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { Injectable } from '@nestjs/common';

const AUTHORIZATION_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const USERINFO_ENDPOINT = 'https://www.googleapis.com/oauth2/v2/userinfo';
const STATE_TTL_MS = 10 * 60 * 1000;
const STATE_CLOCK_SKEW_MS = 30 * 1000;

interface GoogleTokenResponse {
  access_token: string;
}

interface GoogleUserinfoResponse {
  id: string;
  email: string;
  verified_email: boolean;
}

export interface GoogleIdentity {
  externalId: string;
  email: string;
}

/**
 * Google-specific OAuth2 mechanics for "Continuer avec Google" (D-18) —
 * scoped to apps/api/src/auth (same tier as SessionAuthGuard), not
 * packages/naminto-core: UserSystem.authenticateExternal stays
 * provider-neutral, this is where the Google vendor name is allowed to
 * appear (RULES.md). Config is read from process.env lazily (on first
 * use, not in the constructor) and throws a clear error when unset,
 * mirroring AnthropicIntelligenceProvider (packages/providers/intelligence-anthropic).
 *
 * The OAuth `state` param is a stateless signed nonce (HMAC-SHA256 over a
 * timestamped random payload) rather than a server-side session, because
 * this backend has no cookie/session infrastructure at all today — adding
 * one solely for this would be a bigger architectural change than a
 * signed nonce. It only needs to prove *this server* issued the flow and
 * bound its lifetime; Google's own authorization `code` is already
 * single-use and tied to client_id/redirect_uri, so no server-side replay
 * tracking is needed on top.
 */
@Injectable()
export class GoogleOAuthService {
  buildAuthorizationUrl(): string {
    const { clientId, redirectUri } = this.config();
    const url = new URL(AUTHORIZATION_ENDPOINT);
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'openid email profile');
    url.searchParams.set('state', this.signState());
    return url.toString();
  }

  async exchangeCode(code: string): Promise<GoogleIdentity> {
    const { clientId, clientSecret, redirectUri } = this.config();

    const tokenResponse = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    });
    if (!tokenResponse.ok) {
      throw new Error(`GoogleOAuthService: token exchange failed with status ${tokenResponse.status}`);
    }
    const token = (await tokenResponse.json()) as GoogleTokenResponse;

    const userinfoResponse = await fetch(USERINFO_ENDPOINT, {
      headers: { authorization: `Bearer ${token.access_token}` },
    });
    if (!userinfoResponse.ok) {
      throw new Error(`GoogleOAuthService: userinfo request failed with status ${userinfoResponse.status}`);
    }
    const userinfo = (await userinfoResponse.json()) as GoogleUserinfoResponse;

    if (!userinfo.verified_email) {
      throw new Error('GoogleOAuthService: Google account email is not verified.');
    }

    return { externalId: userinfo.id, email: userinfo.email };
  }

  verifyState(state: string | undefined): boolean {
    if (!state) {
      return false;
    }
    const parts = state.split('.');
    if (parts.length !== 2) {
      return false;
    }
    const [payloadB64, signature] = parts;

    let payload: string;
    try {
      payload = Buffer.from(payloadB64, 'base64url').toString('utf8');
    } catch {
      return false;
    }

    const expectedSignature = this.hmac(payload);
    const signatureBuf = Buffer.from(signature, 'hex');
    const expectedBuf = Buffer.from(expectedSignature, 'hex');
    if (signatureBuf.length !== expectedBuf.length || !timingSafeEqual(signatureBuf, expectedBuf)) {
      return false;
    }

    const issuedAt = Number(payload.split('.')[0]);
    if (!Number.isFinite(issuedAt)) {
      return false;
    }
    const now = Date.now();
    return now - issuedAt <= STATE_TTL_MS && issuedAt <= now + STATE_CLOCK_SKEW_MS;
  }

  private signState(): string {
    const payload = `${Date.now()}.${randomBytes(16).toString('hex')}`;
    const signature = this.hmac(payload);
    return `${Buffer.from(payload, 'utf8').toString('base64url')}.${signature}`;
  }

  private hmac(payload: string): string {
    const { stateSecret } = this.config();
    return createHmac('sha256', stateSecret).update(payload).digest('hex');
  }

  private config(): {
    clientId: string;
    clientSecret: string;
    stateSecret: string;
    redirectUri: string;
  } {
    const clientId = process.env['GOOGLE_CLIENT_ID'];
    const clientSecret = process.env['GOOGLE_CLIENT_SECRET'];
    const stateSecret = process.env['AUTH_STATE_SECRET'];

    if (!clientId || !clientSecret || !stateSecret) {
      throw new Error(
        'GoogleOAuthService: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and AUTH_STATE_SECRET must all be configured (see .env.example).',
      );
    }

    const apiUrl = process.env['API_URL'] ?? 'http://localhost:3001';
    return { clientId, clientSecret, stateSecret, redirectUri: `${apiUrl}/auth/google/callback` };
  }
}
