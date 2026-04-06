import { environment } from '@core/environment';
import { Logger } from '@nestjs/common';
import * as fs from 'fs';
import { distinctUntilChanged, Observable, ReplaySubject, Subject } from 'rxjs';
import { Config } from '../config';
import { LoadableConfigService } from '../config.service';

export class LocalConfigService implements LoadableConfigService {
  private readonly logger: Logger = new Logger(LocalConfigService.name);

  private configFileContent: object;
  private subjectAllConfigs: Subject<Config[]> = new ReplaySubject<Config[]>(1);
  private subjects: Map<string, Subject<Config>> = new Map();

  constructor() {
    const path = `./envs/app-config/${environment.core.nodeEnv()}.json`;
    if (!fs.existsSync(path)) {
      throw new Error(`Could not load ${path}. Make sure the file exists.`);
    }
    this.configFileContent = JSON.parse(
      fs.readFileSync(path, {
        encoding: 'utf-8',
      }),
    );
  }

  async load(): Promise<void> {
    this.logger.log('Emitting configs that changed to observers');
    this.subjects.forEach((subject, key) => {
      subject.next(this.getValue(key));
    });

    this.logger.log('Emitting all configs to observers');
    const allConfigs = Object.entries(process.env).map(
      ([key, value]) => new Config(key, value),
    );
    this.subjectAllConfigs.next(allConfigs);
  }

  observeAll(): Observable<Config[]> {
    return this.subjectAllConfigs;
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

  getValue(key: string): Config {
    const value = this.configFileContent[key];
    if (!value) {
      this.logger.warn(`Could not find configuration by key`, key);
    }
    return new Config(key, value);
  }

  async reload(): Promise<void> {
    this.load();
  }

  isLive(): boolean {
    return true;
  }
}
