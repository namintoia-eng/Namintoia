import { Module } from '@nestjs/common';
import { NamintoCoreModule } from '../naminto-core/naminto-core.module';
import { PlanController } from './plan.controller';

@Module({
  imports: [NamintoCoreModule],
  controllers: [PlanController],
})
export class PlanModule {}
