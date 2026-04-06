import { checkAndGetForEnvVariable } from '../util';

export * as appConfig from './lambda-app-config.envars';

export const bucket = (): string => {
  return checkAndGetForEnvVariable('S3_BUCKET');
};
