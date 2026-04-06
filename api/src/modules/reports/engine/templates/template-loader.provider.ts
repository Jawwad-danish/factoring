import { environment } from '@core/environment';
import { CONFIG_SERVICE, ConfigService } from '@module-config';
import { Provider } from '@nestjs/common';
import { S3Service } from '../../../aws';
import { LocalTemplateLoader } from './local.template-loader';
import { CloudTemplateLoader } from './cloud.template-loader';
import { TEMPLATE_LOADER } from './template-loader';

export const templateLoaderProvider: Provider = {
  provide: TEMPLATE_LOADER,
  useFactory: (s3Service: S3Service, configService: ConfigService) => {
    if (environment.isLocal() || environment.isTest()) {
      return new LocalTemplateLoader(configService);
    }
    return new CloudTemplateLoader(configService, s3Service);
  },
  inject: [S3Service, CONFIG_SERVICE],
};
