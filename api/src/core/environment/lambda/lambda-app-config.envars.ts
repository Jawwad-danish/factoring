import { checkAndGetForEnvVariable } from '../util';

export const application = () => {
  return checkAndGetForEnvVariable('AWS_APPCONFIG_APPLICATION');
};

export const environment = () => {
  return checkAndGetForEnvVariable('AWS_APPCONFIG_ENVIRONMENT');
};

export const profile = () => {
  return checkAndGetForEnvVariable('AWS_APPCONFIG_PROFILE');
};

export const extensionHttpPort = () => {
  return checkAndGetForEnvVariable('AWS_APPCONFIG_EXTENSION_HTTP_PORT');
};

export const pollIntervalInSeconds = () => {
  return checkAndGetForEnvVariable(
    'AWS_APPCONFIG_EXTENSION_POLL_INTERVAL_SECONDS',
  );
};
