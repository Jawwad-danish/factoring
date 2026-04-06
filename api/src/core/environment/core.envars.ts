import { checkAndGetForEnvVariable } from './util';

export const nodeEnv = (): string => {
  return checkAndGetForEnvVariable('NODE_ENV');
};

export const origins = (): string[] => {
  const origins = checkAndGetForEnvVariable('ORIGINS');
  return origins.split(',');
};

export const systemId = (): string => {
  return checkAndGetForEnvVariable('SYSTEM_ID');
};

export const systemEmail = (): string => {
  return checkAndGetForEnvVariable('SYSTEM_EMAIL');
};

export const crossAccountAdminEmail = (): string => {
  return checkAndGetForEnvVariable('CROSS_ACCOUNT_ADMIN_EMAIL');
};

export const apiUrl = (): string => {
  const domainAlias = checkAndGetForEnvVariable('ALB_DOMAIN_ALIAS');
  return `https://${domainAlias}`;
};
