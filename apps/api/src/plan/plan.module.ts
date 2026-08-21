import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NamintoCoreModule } from '../naminto-core/naminto-core.module';
import { PlanController } from './plan.controller';

@Module({
  imports: [NamintoCoreModule, AuthModule],
  controllers: [PlanController],
})
export class PlanModule {}
