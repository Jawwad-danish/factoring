import { environment } from '@core/environment';
import { Provider } from '@nestjs/common';
import { LocalMessageConsumer } from './local.message-consumer';
import { MESSAGE_CONSUMER } from './message-consumer';
import { SqsMessageConsumer } from './sqs.message-consumer';
import { CONFIG_SERVICE, ConfigService } from '@module-config';

export const messageConsumerProvider: Provider = {
  provide: MESSAGE_CONSUMER,
  useFactory: async (configService: ConfigService) => {
    if (environment.isLocal() || environment.isTest()) {
      const queueDir = configService.getValue('LOCAL_QUEUE_PATH');
      if (!queueDir.hasValue()) {
        throw new Error('LOCAL_QUEUE_PATH config value is required');
      }
      return new LocalMessageConsumer(queueDir.asString());
    }
    const queueUrl = configService.getValue('WORKER_JOBS_QUEUE_URL');
    if (!queueUrl.hasValue()) {
      throw new Error('WORKER_JOBS_QUEUE_URL config value is required');
    }
    return new SqsMessageConsumer(queueUrl.asString());
  },
  inject: [CONFIG_SERVICE],
};
