import { environment } from '@core/environment';
import { SQSService } from '@module-aws';
import { CONFIG_SERVICE, ConfigService } from '@module-config';
import { Provider } from '@nestjs/common';
import { LocalMessageProducer } from './local.message-producer';
import { MESSAGE_PRODUCER } from './message-producer';
import { SqsMessageProducer } from './sqs.message-producer';

export const messageProducerProvider: Provider = {
  provide: MESSAGE_PRODUCER,
  useFactory: (sqsService: SQSService, configService: ConfigService) => {
    if (environment.isLocal() || environment.isTest()) {
      return new LocalMessageProducer(configService);
    }
    const queueUrl = configService.getValue('WORKER_JOBS_QUEUE_URL');
    if (!queueUrl.hasValue()) {
      throw new Error('WORKER_JOBS_QUEUE_URL config value is required');
    }
    return new SqsMessageProducer(queueUrl.asString(), sqsService);
  },
  inject: [SQSService, CONFIG_SERVICE],
};
