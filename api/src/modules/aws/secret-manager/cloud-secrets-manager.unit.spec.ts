import { CloudSecretsManager } from './cloud-secrets-manager';
import { mockClient } from 'aws-sdk-client-mock';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';

const secretsManagerInstance = mockClient(SecretsManagerClient);
beforeEach(() => {
  secretsManagerInstance.reset();
  jest.clearAllMocks();
});

const mockSecretsManagerResponse = (returnValue: unknown) => {
  secretsManagerInstance
    .on(GetSecretValueCommand)
    .resolves({ SecretString: JSON.stringify(returnValue) });
};

describe('SecretsManager', () => {
  test('Calling secrets manager returns parsed response', async () => {
    const returnValue = { key: 'value' };
    mockSecretsManagerResponse(returnValue);
    const secretsManager = new CloudSecretsManager();

    const result = await secretsManager.fromARN('arn');
    expect(result).toStrictEqual(returnValue);
  });
});
