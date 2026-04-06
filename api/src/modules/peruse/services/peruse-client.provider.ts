import { SecretsSupplier } from '@module-common';
import { HttpService } from '@nestjs/axios';
import { Provider } from '@nestjs/common';
import { PeruseClient } from './peruse-client';

export const peruseClientProvider: Provider = {
  provide: PeruseClient,
  useFactory: async (secretsSupplier: SecretsSupplier) => {
    const secrets = await secretsSupplier.get('PERUSE_SECRET_ARN');
    return new PeruseClient(
      new HttpService(),
      secrets.URL as string,
      secrets.KEY as string,
    );
  },
  inject: [SecretsSupplier],
};
