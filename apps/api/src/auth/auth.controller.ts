import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Headers,
  Inject,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import type { Session, User, UserSystem } from '@namintoia/naminto-core';
import { USER_SYSTEM } from '../naminto-core/naminto-core.module';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

@Controller('auth')
export class AuthController {
  constructor(@Inject(USER_SYSTEM) private readonly userSystem: UserSystem) {}

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
  async me(@Headers('authorization') authorization: string | undefined): Promise<User> {
    const token = extractBearerToken(authorization);
    const user = await this.userSystem.verifySession(token);
    if (!user) {
      throw new UnauthorizedException('Invalid or expired session.');
    }
    return user;
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

function extractBearerToken(authorization: string | undefined): string {
  const prefix = 'Bearer ';
  if (!authorization || !authorization.startsWith(prefix)) {
    throw new UnauthorizedException('Missing or malformed Authorization header.');
  }
  return authorization.slice(prefix.length);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error.';
}
