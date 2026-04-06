export interface FeatureTogglesService {
  isEnabledForClient(
    clientId: string,
    flag: string,
    defaultValue: boolean,
  ): Promise<boolean>;
}
