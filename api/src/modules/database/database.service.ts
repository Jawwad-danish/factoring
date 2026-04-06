import { RequestContext, UnderscoreNamingStrategy } from '@mikro-orm/core';
import { EntityManager, MikroORM, Options } from '@mikro-orm/postgresql';
import { registry } from '@module-persistence/entities';
import { historyRegistry } from '@module-persistence/history';
import { Logger, OnApplicationShutdown } from '@nestjs/common';
import { firstValueFrom, skip, throwError, timeout } from 'rxjs';
import {
  DatabaseCredentialService,
  DatabaseCredentials,
} from './database-credentials.service';
import { HistorySubscriber } from './subscribers';

export class DatabaseService implements OnApplicationShutdown {
  protected mikroORM: MikroORM;
  private readonly logger: Logger = new Logger(DatabaseService.name);

  constructor(
    private readonly databaseCredentialsService: DatabaseCredentialService,
  ) {}

  async onApplicationShutdown() {
    this.logger.log(
      `Received application shutdown signal. Closing database connection.`,
    );
    await this.mikroORM.close();
  }

  async connect(): Promise<void> {
    this.logger.log('Loading database connection');
    const databaseCredentials = await this.getDatabaseCredentials();
    await this.buildMikroORM(databaseCredentials);
    this.databaseCredentialsService
      .observe()
      .pipe(skip(1))
      .subscribe((credentials) => {
        this.onDatabaseCredentialsChange(credentials);
      });
  }

  private async getDatabaseCredentials(): Promise<DatabaseCredentials> {
    this.logger.debug('Fetching database credentials');
    const timeoutMS: number = parseInt(
      process.env.DB_INITIAL_CONNECTION_TIMEOUT || '30000',
      10,
    );
    const source = this.databaseCredentialsService.observe().pipe(
      timeout({
        each: timeoutMS,
        with: () =>
          throwError(
            () =>
              new Error(
                `Could not obtain database credentials after ${timeoutMS} miliseconds`,
              ),
          ),
      }),
    );
    return firstValueFrom(source);
  }

  private async onDatabaseCredentialsChange(credentials: DatabaseCredentials) {
    this.logger.log('Initializing the database with new credentials');
    if (this.mikroORM) {
      try {
        this.logger.warn('Closing the existing database connection');
        await this.mikroORM.close();
      } catch (error) {
        this.logger.error(
          'Could not close existing database connection',
          error,
        );
      }
    } else {
      this.buildMikroORM(credentials);
    }
  }

  private async buildMikroORM(credentials: DatabaseCredentials) {
    const options: Options = {
      user: credentials.username,
      password: credentials.password,
      dbName: credentials.database,
      namingStrategy: UnderscoreNamingStrategy,
      host: credentials.host,
      port: credentials.port,
      entities: [...registry, ...historyRegistry],
      subscribers: [new HistorySubscriber()],
      allowGlobalContext: false,
      connect: true,
      ignoreUndefinedInQuery: true,
      pool: {
        min: 0,
      },
    };
    if (credentials.readerEndpointHost) {
      this.logger.debug('Adding reader endpoint to MikroORM options');
      options.replicas = [
        {
          user: credentials.username,
          password: credentials.password,
          dbName: credentials.database,
          host: credentials.readerEndpointHost,
          port: credentials.port,
        },
      ];
    }
    this.mikroORM = await MikroORM.init(options);
    this.logger.debug('Connected to database');
  }

  async isConnected(): Promise<boolean> {
    if (!this.mikroORM) {
      return false;
    }
    return this.mikroORM.isConnected();
  }

  getMikroORM(): MikroORM {
    return this.mikroORM;
  }

  getEntityManager() {
    return this.mikroORM.em as EntityManager;
  }

  withRequestContext<T>(next: (...args: any[]) => T): T {
    return RequestContext.create(this.getMikroORM().em, next);
  }

  flush(): Promise<void> {
    return this.mikroORM.em.flush();
  }
}
