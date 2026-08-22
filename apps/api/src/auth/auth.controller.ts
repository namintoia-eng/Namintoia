import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Inject,
  Post,
  Query,
  Redirect,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Session, User, UserSystem } from '@namintoia/naminto-core';
import { USER_SYSTEM } from '../naminto-core/naminto-core.module';
import { CurrentUser } from './current-user.decorator';
import { GoogleOAuthService } from './google-oauth.service';
import { SessionAuthGuard } from './session-auth.guard';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(USER_SYSTEM) private readonly userSystem: UserSystem,
    @Inject(GoogleOAuthService) private readonly googleOAuth: GoogleOAuthService,
  ) {}

  @Post('register')
  async register(@Body() body: unknown): Promise<User> {
    const { email, password } = extractCredentials(body);
    try {
      return await this.userSystem.register(email, password);
    } catch (error) {
      if (error instanceof Error && /already registered/.test(error.message)) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }

  @Post('login')
  async login(@Body() body: unknown): Promise<Session> {
    const { email, password } = extractCredentials(body);
    try {
      return await this.userSystem.authenticate(email, password);
    } catch (error) {
      throw new UnauthorizedException(errorMessage(error));
    }
  }

  @Get('me')
  @UseGuards(SessionAuthGuard)
  me(@CurrentUser() user: User): User {
    return user;
  }

  /**
   * No try/catch here on purpose: if Google isn't configured, this throws
   * before the browser ever leaves the app, so a normal Nest JSON error
   * response is fine (same posture as /plan surfacing a missing
   * ANTHROPIC_API_KEY). Only the callback below needs to swallow errors.
   */
  @Get('google')
  @Redirect()
  googleLogin(): { url: string } {
    return { url: this.googleOAuth.buildAuthorizationUrl() };
  }

  /**
   * The browser is already off-domain (returning from Google) by the time
   * this runs, so a JSON error response would be a dead end for the user
   * — every failure path redirects back to the app with `?error=` instead
   * of throwing. The session token rides the URL *fragment* (`#token=`),
   * never a query param: fragments are never sent to the server or logged
   * anywhere, unlike query params.
   */
  @Get('google/callback')
  @Redirect()
  async googleCallback(@Query() query: unknown): Promise<{ url: string }> {
    const appUrl = process.env['APP_URL'] ?? 'http://localhost:3000';
    try {
      const { code, state } = extractGoogleCallbackParams(query);
      if (!this.googleOAuth.verifyState(state)) {
        throw new Error('Invalid or expired Google sign-in attempt.');
      }
      const identity = await this.googleOAuth.exchangeCode(code);
      const session = await this.userSystem.authenticateExternal({ provider: 'google', ...identity });
      return { url: `${appUrl}/#token=${encodeURIComponent(session.token)}` };
    } catch (error) {
      return { url: `${appUrl}/?error=${encodeURIComponent(errorMessage(error))}` };
    }
  }
}

function extractCredentials(body: unknown): { email: string; password: string } {
  if (typeof body !== 'object' || body === null) {
    throw new BadRequestException('Request body must be { "email": "...", "password": "..." }.');
  }
  const record = body as Record<string, unknown>;

  const email = record['email'];
  if (typeof email !== 'string' || !EMAIL_PATTERN.test(email)) {
    throw new BadRequestException('"email" must be a valid email address.');
  }

  const password = record['password'];
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    throw new BadRequestException(`"password" must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }

  return { email, password };
}

function extractGoogleCallbackParams(query: unknown): { code: string; state: string | undefined } {
  if (typeof query !== 'object' || query === null) {
    throw new Error('Missing Google callback parameters.');
  }
  const record = query as Record<string, unknown>;

  const code = record['code'];
  if (typeof code !== 'string' || code.length === 0) {
    throw new Error('Missing Google authorization code.');
  }

  const state = record['state'];
  return { code, state: typeof state === 'string' ? state : undefined };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error.';
}
