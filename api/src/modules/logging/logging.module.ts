import { Module } from '@nestjs/common';
import { BobtailConfigModule } from '../bobtail-config';
import { loggerProvider } from './logger.provider';

@Module({
  imports: [BobtailConfigModule],
  providers: [loggerProvider],
})
export class BobtailLoggingModule {}
