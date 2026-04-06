import { AWSModule } from '@module-aws';
import { BobtailConfigModule } from '@module-config';
import { PersistenceModule } from '@module-persistence';
import { Module } from '@nestjs/common';
import { MESSAGE_PRODUCER, messageProducerProvider } from './producers';
import { JobService } from './services';

@Module({
  imports: [AWSModule, PersistenceModule, BobtailConfigModule],
  providers: [messageProducerProvider, JobService],
  exports: [messageProducerProvider, MESSAGE_PRODUCER, JobService],
})
export class WorkerApiModule {}
