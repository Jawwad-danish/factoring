import { environment } from '@core/environment';
import { Logger } from '@nestjs/common';
import * as fs from 'fs';
import { SecretsManager } from './secrets-manager';

export class LocalSecretsManager implements SecretsManager {
  private readonly logger: Logger = new Logger(LocalSecretsManager.name);

  async fromARN(arn: string): Promise<Record<string, unknown>> {
    const path = `./envs/secrets/${environment.core.nodeEnv()}/${arn}.json`;
    if (!fs.existsSync(path)) {
      throw new Error(`Could not load ${path}. Make sure the file exists.`);
    }
    try {
      return JSON.parse(fs.readFileSync(path, 'utf-8'));
    } catch (error) {
      this.logger.error(`Could not parse file ${path} as JSON `);
      throw error;
    }
  }
}
