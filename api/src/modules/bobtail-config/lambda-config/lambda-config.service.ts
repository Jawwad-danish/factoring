import { Logger } from '@nestjs/common';
import axios from 'axios';
import { distinctUntilChanged, Observable, ReplaySubject, Subject } from 'rxjs';
import { Config } from '../config';
import { LoadableConfigService } from '../config.service';

export interface LambdaAppConfigParams {
  port: number;
  application: string;
  env: string;
  profile: string;
}

interface Configuration {
  [key: string]: any;
}
export class LambdaAppConfigService implements LoadableConfigService {
  private logger: Logger = new Logger(LambdaAppConfigService.name);

  private url: string;
  private configuration: Configuration = {};
  private subjectAllConfigs: Subject<Config[]> = new ReplaySubject<Config[]>(1);
  private subjects: Map<string, Subject<Config>> = new Map();
  private shouldEmit = false;

  constructor(configParams: LambdaAppConfigParams) {
    this.url = `http://localhost:${configParams.port}/applications/${configParams.application}/environments/${configParams.env}/configurations/${configParams.profile}`;
  }

  async load() {
    await this.fetchLatestConfiguration();
    await this.emit();
  }

  private async fetchLatestConfiguration(): Promise<void> {
    this.logger.log(
      'Fetching latest AWS AppConfig configuration from Lambda Layer',
    );

    try {
      const response = await axios.get(this.url);
      this.logger.log('Received latest AWS AppConfig configuration response');

      if (this.hasContent(response)) {
        this.configuration = response.data as Configuration;
        this.shouldEmit = true;
        this.logger.log(
          'Latest AWS AppConfig configuration was loaded with success',
        );
      }
    } catch (error) {
      this.logger.error(
        'Could not obtain latest AWS AppConfig configuration from Lambda Layer',
        error,
      );
      throw error;
    }
  }

  private hasContent(response: any) {
    if (Object.keys(response.data).length !== 0) {
      return true;
    }

    this.logger.warn(
      'Could not find content on the latest AWS AppConfig configuration response',
    );
    return false;
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
    if (!value) {
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
    return this.load();
  }

  observeAll(): Observable<Config[]> {
    return this.subjectAllConfigs;
  }

  isLive(): boolean {
    return true;
  }
}
