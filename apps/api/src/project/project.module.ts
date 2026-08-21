import { Module } from '@nestjs/common';
import { NamintoCoreModule } from '../naminto-core/naminto-core.module';
import { AuthModule } from '../auth/auth.module';
import { ProjectController } from './project.controller';

@Module({
  imports: [NamintoCoreModule, AuthModule],
  controllers: [ProjectController],
})
export class ProjectModule {}
