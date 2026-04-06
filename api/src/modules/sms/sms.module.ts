import { AWSModule } from '@module-aws';
import { CommonModule } from '@module-common';
import { BobtailConfigModule } from '@module-config';
import { Module } from '@nestjs/common';
import { SmsService } from './services';
import { TwilioService } from './services/twilio.service';

@Module({
  providers: [SmsService, TwilioService],
  exports: [SmsService],
  imports: [AWSModule, BobtailConfigModule, CommonModule],
  controllers: [],
})
export class SmsModule {}
