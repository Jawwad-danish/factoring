import {
  GetSecretValueCommand,
  ListSecretsCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import { environment } from '@core/environment';
import { ErrorFactory } from '@core/errors';
import { Logger } from '@nestjs/common';
import { SecretsManager } from './secrets-manager';

export class CloudSecretsManager implements SecretsManager {
  private readonly client = new SecretsManagerClient({
    region: environment.aws.defaultRegion(),
  });
  private readonly logger: Logger = new Logger(CloudSecretsManager.name);

  async fromARN(arn: string): Promise<Record<string, unknown>> {
    let secret = await this.getSecretValue(arn);
    if (secret == null) {
      this.logger.warn(
        `Unable to find secret by ARN ${arn}. Trying to find best match ARN from list of secrets`,
      );
      const matchARN = await this.tryMatchARN(arn);
      if (matchARN != null) {
        secret = await this.getSecretValue(matchARN);
        this.logger.warn(
          `Found a match for arn ${arn}. Matching arn ${matchARN}`,
        );
      } else {
        this.logger.warn(`Unable to match ARN ${arn} against list of secrets`);
      }
    }
    if (secret) {
      try {
        return JSON.parse(secret);
      } catch (error) {
        this.logger.error(
          `Could not parse SecretString from AWS Secrets Manager for arn ${arn}`,
        );
        throw error;
      }
    } else {
      this.logger.error(
        `Could not read SecretString from AWS Secrets Manager for arn ${arn}`,
      );
      throw ErrorFactory.notFound('Secret', 'SecretString', arn);
    }
  }

  private async getSecretValue(arn: string): Promise<null | string> {
    try {
      const command = new GetSecretValueCommand({ SecretId: arn });
      const { SecretString } = await this.client.send(command);
      return SecretString ?? null;
    } catch (error) {
      return null;
    }
  }

  private async tryMatchARN(arn: string): Promise<null | string> {
    const secretARNs: string[] = [];
    let token: string | undefined;
    do {
      const { SecretList, NextToken } = await this.client.send(
        new ListSecretsCommand({ NextToken: token }),
      );
      if (SecretList) {
        for (const { ARN } of SecretList) {
          if (ARN) {
            secretARNs.push(ARN);
          }
        }
        token = NextToken;
      }
    } while (token != undefined);

    return secretARNs.find((secretARN) => secretARN.startsWith(arn)) ?? null;
  }
}
