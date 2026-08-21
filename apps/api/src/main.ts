import 'reflect-metadata';
import { resolve } from 'node:path';
import { config } from 'dotenv';

// apps/api never has its own .env — the monorepo root .env (see
// .env.example) is the single source of truth for every provider's secrets.
// This must run before AppModule is imported: providers read process.env
// in their constructors, which Nest invokes as soon as the module tree is
// built.
config({ path: resolve(__dirname, '../../../.env') });

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: process.env['APP_URL'] ?? 'http://localhost:3000' });
  const port = process.env['PORT'] ? Number(process.env['PORT']) : 3001;
  await app.listen(port);
}

void bootstrap();
