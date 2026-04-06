import { AWSModule } from '@module-aws';
import { BobtailConfigModule } from '@module-config';
import { Module } from '@nestjs/common';
import {
  ConvertCredentialsService,
  convertServiceProvider,
  GenerateReleaseLetterHandler,
} from './services';
import { CommonModule } from '@module-common';

@Module({
  providers: [
    GenerateReleaseLetterHandler,
    convertServiceProvider,
    ConvertCredentialsService,
  ],
  exports: [],
  imports: [BobtailConfigModule, AWSModule, CommonModule],
  controllers: [],
})
export class DocumentGenerationModule {}
