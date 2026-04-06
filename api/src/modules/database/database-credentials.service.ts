import { SECRETS_MANAGER, SecretsManager } from '@module-aws';
import { CONFIG_SERVICE, ConfigService } from '@module-config';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Observable, ReplaySubject } from 'rxjs';
import { Config } from '../bobtail-config/config';

const DB_SECRET_ARN_KEY = 'DB_SECRET_ARN';
const DB_READER_ENDPOINT_HOST_KEY = 'DB_READER_ENDPOINT_HOST';

export type DatabaseCredentials = {
  username: string;
  password: string;
  database: string;
  host: string;
  port: number;
  readerEndpointHost?: string;
};

@Injectable()
export class DatabaseCredentialService {
  private readonly logger: Logger = new Logger(DatabaseCredentialService.name);
  private subject = new ReplaySubject<DatabaseCredentials>(1);

  private latestCredentials: DatabaseCredentials | null = null;
  private latestReaderHost: string | null = null;

  constructor(
    @Inject(CONFIG_SERVICE) readonly configService: ConfigService,
    @Inject(SECRETS_MANAGER) readonly secretsManager: SecretsManager,
  ) {
    configService
      .observeValue(DB_SECRET_ARN_KEY)
      .subscribe((config) => this.onSecretArnChange(config));
    configService
      .observeValue(DB_READER_ENDPOINT_HOST_KEY)
      .subscribe((config) => this.onReaderEndpointHostChange(config));
  }

  private async onSecretArnChange(config: Config) {
    const arn = config.asString();
    try {
      const secrets = await this.secretsManager.fromARN(arn);
      this.latestCredentials = {
        username: secrets.username as string,
        password: secrets.password as string,
        database: secrets.dbname as string,
        port: secrets.port as number,
        host: secrets.host as string,
      };
      this.logger.log(`Successfully updated base credentials from ARN ${arn}`);
    } catch (error) {
      this.logger.error(`Could not obtain secrets from ARN ${arn}`, error);
      this.latestCredentials = null;
    }
    this.tryEmitCompleteCredentials();
  }

  private onReaderEndpointHostChange(config: Config) {
    const readerEndpointHost = config.asString();
    this.logger.log(
      `Processing Reader Endpoint Host change: ${readerEndpointHost}`,
    );
    this.latestReaderHost = readerEndpointHost;

    this.tryEmitCompleteCredentials();
  }

  private tryEmitCompleteCredentials() {
    if (this.latestCredentials && this.latestReaderHost) {
      const completeCredentials: DatabaseCredentials = {
        ...this.latestCredentials,
        readerEndpointHost: this.latestReaderHost,
      };
      this.logger.log(
        'Emitting complete database credentials (state combined)',
      );
      this.subject.next(completeCredentials);
    } else {
      this.logger.log(
        'Cannot emit credentials yet. Waiting for both base credentials and reader host.',
        {
          hasBase: !!this.latestCredentials,
          hasHost: !!this.latestReaderHost,
        },
      );
    }
  }

  observe(): Observable<DatabaseCredentials> {
    return this.subject;
  }
}
