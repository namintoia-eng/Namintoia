import { Module } from '@nestjs/common';
import { NamintoCoreModule } from '../naminto-core/naminto-core.module';
import { AuthController } from './auth.controller';

@Module({
  imports: [NamintoCoreModule],
  controllers: [AuthController],
})
export class AuthModule {}
