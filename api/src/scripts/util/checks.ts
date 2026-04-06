import { environment } from '@core/environment';

const SYSTEM_ID =
  environment.util.checkAndGetForEnvVariable('SCRIPT_SYSTEM_ID');
export const isSystemUser = (id: string): boolean => {
  return id === SYSTEM_ID;
};

export const getSystemID = (): string => {
  return SYSTEM_ID;
};
