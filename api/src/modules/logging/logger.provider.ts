import { environment } from '@core/environment';
import { Provider } from '@nestjs/common';
import { LocalLogger } from './local-logger.service';
import { CloudLogger } from './cloud-logger.service';
import { ConfigService, CONFIG_SERVICE } from '../bobtail-config';

export const LOGGER_PROVIDER = 'LoggerService';

export const loggerProvider: Provider = {
  provide: LOGGER_PROVIDER,
  useFactory: async (configService: ConfigService) => {
    if (environment.isLocal()) {
      return new LocalLogger(configService);
    }
    return new CloudLogger(configService);
  },
  inject: [CONFIG_SERVICE],
};
