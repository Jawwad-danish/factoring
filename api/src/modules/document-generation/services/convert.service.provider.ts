import { Provider } from '@nestjs/common';
import { ConvertService } from './convert.service';
import { ConvertCredentialsService } from './convert-credentials.service';

export const convertServiceProvider: Provider = {
  provide: ConvertService,
  useFactory: async (convertCredentialsService: ConvertCredentialsService) => {
    const { key, uri } = await convertCredentialsService.getCreds();
    return new ConvertService(key, uri);
  },
  inject: [ConvertCredentialsService],
};
