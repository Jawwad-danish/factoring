import {
  AppConfigDataClient,
  GetLatestConfigurationCommand,
  GetLatestConfigurationResponse,
  StartConfigurationSessionCommand,
} from '@aws-sdk/client-appconfigdata';
import { runPeriodically } from '@core/date-time';
import { Logger } from '@nestjs/common';
import { Observable, ReplaySubject, Subject, distinctUntilChanged } from 'rxjs';
import { Config } from '../config';
import { AppConfigParams } from '../config-params';
import { LoadableConfigService } from '../config.service';

export const DEFAULT_POLL_INTERVAL_SECONDS = 60;

interface Configuration {
  [key: string]: any;
}

export class AppConfigService implements LoadableConfigService {
  private logger: Logger = new Logger(AppConfigService.name);

  private client: AppConfigDataClient;
  private token?: string;
  private configuration: Configuration = {};
  private subjectAllConfigs: Subject<Config[]> = new ReplaySubject<Config[]>(1);
  private subjects: Map<string, Subject<Config>> = new Map();
  private poolIntervalInSeconds?: number;
  private shouldEmit = false;

  constructor(private readonly configParams: AppConfigParams) {
    this.client = new AppConfigDataClient({
      apiVersion: '2021-11-11',
      region: configParams.region,
    });
    if (configParams.enablePooling) {
      this.poolIntervalInSeconds = this.getPoolingInterval(configParams);
    }
  }

  private getPoolingInterval(configParams: AppConfigParams): number {
    if (configParams.pollIntervalInSeconds) {
      if (configParams.pollIntervalInSeconds < DEFAULT_POLL_INTERVAL_SECONDS) {
        this.logger.warn(
          `Pooling interval is smaller than the required minimum. Will use the default ${DEFAULT_POLL_INTERVAL_SECONDS}`,
        );
        return DEFAULT_POLL_INTERVAL_SECONDS;
      }
      return configParams.pollIntervalInSeconds;
    }
    return DEFAULT_POLL_INTERVAL_SECONDS;
  }

  async load() {
    await this.startConfigSession();
    await this.fetchLatestConfiguration();
    await this.emit();
    this.periodicalTask();
  }

  private async startConfigSession(): Promise<void> {
    this.logger.log('Starting AWS AppConfig configuration session');
    try {
      const command = new StartConfigurationSessionCommand({
        ConfigurationProfileIdentifier: this.configParams.profile,
        ApplicationIdentifier: this.configParams.application,
        EnvironmentIdentifier: this.configParams.environment,
        RequiredMinimumPollIntervalInSeconds: DEFAULT_POLL_INTERVAL_SECONDS,
      });
      const response = await this.client.send(command);
      if (!response.InitialConfigurationToken) {
        throw new Error(
          'AWS AppConfig configuration session response does not have a configuration token',
        );
      }
      this.token = response.InitialConfigurationToken;
      this.logger.log('AWS AppConfig configuration session initiated');
    } catch (error) {
      this.logger.error(
        'Could not start AWS AppConfig configuration session',
        error,
      );
      throw error;
    }
  }

  private async fetchLatestConfiguration(): Promise<void> {
    this.logger.log('Fetching latest AWS AppConfig configuration');
    if (!this.token) {
      this.logger.warn('No configuration token available');
      return;
    }

    try {
      const command = new GetLatestConfigurationCommand({
        ConfigurationToken: this.token,
      });
      const response: GetLatestConfigurationResponse = await this.client.send(
        command,
      );
      this.logger.log('Received latest AWS AppConfig configuration response');

      if (!response.NextPollConfigurationToken) {
        throw new Error(
          'AWS AppConfig latest configuration response does not have a configuration token',
        );
      }
      this.token = response.NextPollConfigurationToken;
      if (this.hasContent(response)) {
        this.configuration = this.parseLatestConfigurationResponse(response);
        this.shouldEmit = true;
        this.logger.log(
          'Latest AWS AppConfig configuration was parsed with success',
        );
      }
    } catch (error) {
      this.logger.error(
        'Could not obtain latest AWS AppConfig configuration',
        error,
      );
      throw error;
    }
  }

  private hasContent(response: GetLatestConfigurationResponse) {
    if (response.Configuration?.length !== 0) {
      return true;
    }

    this.logger.warn(
      'Could not find content on the latest AWS AppConfig configuration response',
    );
    return false;
  }

  private parseLatestConfigurationResponse(
    response: GetLatestConfigurationResponse,
  ): Configuration {
    if (response.ContentType === 'application/json') {
      this.logger.log('Parsing latest AWS AppConfig configuration as JSON');
      const content = new TextDecoder().decode(response.Configuration);
      return JSON.parse(content);
    }

    this.logger.error(
      'Could not parse latest AWS AppConfig configuration because content type is',
      response.ContentType,
    );
    throw new Error('Could not parse latest AWS AppConfig configuration');
  }

  private async emit(): Promise<void> {
    if (!this.shouldEmit) {
      return;
    }

    this.shouldEmit = false;
    this.logger.log('Emitting configs that changed to observers');
    this.subjects.forEach((subject, key) => {
      subject.next(this.getValue(key));
    });

    this.logger.log('Emitting all configs to observers');
    const allConfigs = Object.entries(this.configuration).map(
      (entry) => new Config(entry[0], entry[1]),
    );
    this.subjectAllConfigs.next(allConfigs);
  }

  getValue(key: string): Config {
    const value = this.configuration[key];
    if (!Object.keys(this.configuration).includes(key)) {
      this.logger.warn(`Could not find configuration by key`, key);
    }
    return new Config(key, value);
  }

  observeValue(key: string): Observable<Config> {
    let subject = this.subjects.get(key);
    if (subject === undefined) {
      subject = new ReplaySubject<Config>(1);
      this.subjects.set(key, subject);
    }
    subject.next(this.getValue(key));
    return subject.pipe(
      distinctUntilChanged((previous: Config, current: Config) => {
        return (
          previous.getKey() === current.getKey() &&
          previous.asRaw() === current.asRaw()
        );
      }),
    );
  }

  async reload(): Promise<void> {
    await this.fetchLatestConfiguration();
    await this.emit();
  }

  observeAll(): Observable<Config[]> {
    return this.subjectAllConfigs;
  }

  private periodicalTask(): void {
    if (!this.poolIntervalInSeconds) {
      this.logger.warn('Pooling is not enabled');
      return;
    }

    this.logger.log(
      `Enabled pooling every ${this.poolIntervalInSeconds} seconds`,
    );
    runPeriodically(() => {
      return this.reload();
    }, this.poolIntervalInSeconds);
  }

  isLive(): boolean {
    return this.token !== undefined;
  }
}
