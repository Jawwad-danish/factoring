import { Provider } from '@nestjs/common';
import { init, LDClient } from '@launchdarkly/node-server-sdk';
import { LaunchDarklyConfigurationSupplier } from './launch-darkly-configuration.supplier';
import { environment } from '@core/environment';

export const LD_CLIENT = 'LD_CLIENT';

export const LaunchDarklyClientProvider: Provider<LDClient> = {
  provide: LD_CLIENT,
  useFactory: async (
    ldSupplier: LaunchDarklyConfigurationSupplier,
  ): Promise<LDClient> => {
    const configs = await ldSupplier.get();
    const ldClient = init(configs.KEY, {
      offline: environment.isTest() || environment.isLocal(),
    });
    await ldClient.waitForInitialization();

    return ldClient;
  },
  inject: [LaunchDarklyConfigurationSupplier],
};
