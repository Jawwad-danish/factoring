import { INestApplicationContext } from '@nestjs/common';
import { getSecrets as getSecretsFromKeyWithArn } from './app-config';
import { Filestack } from '../../core/services/filestack/filestack';

type FilestackSecrets = {
  key: string;
  secret: string;
};

export const buildFilestackClient = async (
  app: INestApplicationContext,
): Promise<Filestack> => {
  console.log('Resolving Filestack client');
  const secretsResponse = await getFilestackSecrets(app);
  const client = new Filestack(secretsResponse.key, secretsResponse.secret);
  console.log('Resolved Filestack client');
  return client;
};

export const getFilestackSecrets = async (
  app: INestApplicationContext,
): Promise<FilestackSecrets> => {
  const secrets = await getSecretsFromKeyWithArn(app, 'FILESTACK_SECRET_ARN');
  return {
    key: secrets['FILESTACK_KEY'] as string,
    secret: secrets['FILESTACK_SECRET'] as string,
  };
};
