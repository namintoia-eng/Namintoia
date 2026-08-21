import { Module } from '@nestjs/common';
import { NamintoCoreModule } from '../naminto-core/naminto-core.module';
import { AuthController } from './auth.controller';
import { SessionAuthGuard } from './session-auth.guard';

@Module({
  imports: [NamintoCoreModule],
  controllers: [AuthController],
  providers: [SessionAuthGuard],
  exports: [SessionAuthGuard],
})
export class AuthModule {}
