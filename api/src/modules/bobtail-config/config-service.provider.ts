import { environment } from '@core/environment';
import { Logger, Provider } from '@nestjs/common';
import { AppConfigService } from './app-config/app-config.service';
import { AppConfigParams } from './config-params';
import { CONFIG_SERVICE } from './config.service';
import {
  LambdaAppConfigParams,
  LambdaAppConfigService,
} from './lambda-config/lambda-config.service';
import { LocalConfigService } from './local-config/local-config.service';

const logger = new Logger('ConfigServiceProvider');
export const configServiceProvider: Provider = {
  provide: CONFIG_SERVICE,
  useFactory: async () => {
    if (environment.isLocal() || environment.isTest()) {
      return buildLocalConfigService();
    } else if (environment.isLambdaContext()) {
      return buildLambdaAppConfigService({
        env: process.env.AWS_APPCONFIG_ENVIRONMENT as string,
        port: parseInt(process.env.AWS_APPCONFIG_EXTENSION_HTTP_PORT as string),
        application: process.env.AWS_APPCONFIG_APPLICATION as string,
        profile: process.env.AWS_APPCONFIG_PROFILE as string,
      });
    }
    return buildAppConfigService({
      region: process.env.AWS_DEFAULT_REGION as string,
      environment: process.env.AWS_APPCONFIG_ENVIRONMENT as string,
      application: process.env.AWS_APPCONFIG_APPLICATION as string,
      profile: process.env.AWS_APPCONFIG_PROFILE as string,
      enablePooling: process.env.AWS_APPCONFIG_ENABLE_POOLING === 'true',
      pollIntervalInSeconds: parseInt(
        process.env.AWS_APPCONFIG_POLL_INTERVAL as string,
        10,
      ),
    });
  },
};

const buildLocalConfigService = async () => {
  logger.log(`Instantiating ${LocalConfigService.name}`);
  const configService = new LocalConfigService();
  await configService.load();
  return configService;
};

export const buildAppConfigService = async (params: AppConfigParams) => {
  logger.log(
    `Instantiating ${AppConfigService.name} with ${JSON.stringify(params)}`,
  );
  const configService = new AppConfigService(params);

  try {
    await configService.load();
    return configService;
  } catch (error) {
    logger.error(`Could not instantiate the '${AppConfigService.name}'`);
    throw error;
  }
};

export const buildLambdaAppConfigService = async (
  params: LambdaAppConfigParams,
) => {
  logger.log(
    `Instantiating ${LambdaAppConfigService.name} with ${JSON.stringify(
      params,
    )}`,
  );
  const configService = new LambdaAppConfigService(params);

  try {
    await configService.load();
    return configService;
  } catch (error) {
    logger.error(`Could not instantiate the '${LambdaAppConfigService.name}'`);
    throw error;
  }
};
