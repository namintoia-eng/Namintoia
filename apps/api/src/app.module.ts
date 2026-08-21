import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { NamintoCoreModule } from './naminto-core/naminto-core.module';

@Module({
  imports: [HealthModule, NamintoCoreModule],
})
export class AppModule {}
