export type ConfigParams = {
  region: string;
  environment: string;
};

export type AppConfigParams = ConfigParams & {
  application: string;
  profile: string;
  enablePooling?: boolean;
  pollIntervalInSeconds?: number;
};

export function isAppConfigParams(object: any): object is AppConfigParams {
  return 'application' in object && 'profile' in object;
}
