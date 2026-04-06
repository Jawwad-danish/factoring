import { INestApplicationContext } from '@nestjs/common';
import axios from 'axios';
import { environment } from '@core/environment';
import { SECRETS_MANAGER, SecretsManager } from '@module-aws';

export const getAppConfigUrl = () => {
  const port = environment.lambda.appConfig.extensionHttpPort();
  const application = environment.lambda.appConfig.application();
  const env = environment.lambda.appConfig.environment();
  const profile = environment.lambda.appConfig.profile();
  return `http://localhost:${port}/applications/${application}/environments/${env}/configurations/${profile}`;
};

export const getConfigFromAppConfig = async (key: string): Promise<string> => {
  const response = await axios.get(getAppConfigUrl());
  if (!response.data[key]) {
    throw new Error(`Missing AppConfig ${key} key`);
  }
  return response.data[key] as string;
};

export const getSecrets = async (
  nestApp: INestApplicationContext,
  arnKey: string,
): Promise<Record<string, unknown>> => {
  console.log('Fetching secrets');
  const arn = await getConfigFromAppConfig(arnKey);
  const secretsManager = nestApp.get<SecretsManager>(SECRETS_MANAGER);
  const secrets = await secretsManager.fromARN(arn);
  console.log('Retreived secrets');
  return secrets;
};
