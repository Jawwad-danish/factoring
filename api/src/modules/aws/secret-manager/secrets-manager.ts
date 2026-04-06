export const SECRETS_MANAGER = 'SecretsManager';
export interface SecretsManager {
  fromARN(arn: string): Promise<Record<string, unknown>>;
}
