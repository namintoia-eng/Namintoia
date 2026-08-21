import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { NamintoCoreModule } from './naminto-core/naminto-core.module';
import { PlanModule } from './plan/plan.module';

@Module({
  imports: [HealthModule, NamintoCoreModule, PlanModule],
})
export class AppModule {}
