import { INestApplicationContext } from '@nestjs/common';
import { Convert } from '@core/services';
import {
  getConfigFromAppConfig,
  getSecrets as getSecretsFromKeyWithArn,
} from './app-config';

const getConvertAPIKey = async (
  app: INestApplicationContext,
): Promise<string> => {
  const secrets = await getSecretsFromKeyWithArn(app, 'CONVERTAPI_SECRET_ARN');
  return secrets['CONVERT_API_KEY'] as string;
};

const getConvertApiUri = async (): Promise<string> => {
  return getConfigFromAppConfig('CONVERT_API_URI');
};

export const buildConvertAPIClient = async (
  app: INestApplicationContext,
): Promise<Convert> => {
  console.log('Resolving Convert API client');
  const key = await getConvertAPIKey(app);
  const uri = await getConvertApiUri();
  const client = new Convert(key, uri);
  console.log('Resolved Convert API client');
  return client;
};
