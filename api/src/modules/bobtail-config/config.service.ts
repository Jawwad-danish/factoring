import { Observable } from 'rxjs';
import { Config } from './config';

export const CONFIG_SERVICE = 'ConfigService';

export interface ConfigService {
  observeAll(): Observable<Config[]>;

  observeValue(key: string): Observable<Config>;

  getValue(key: string): Config;

  reload(): Promise<void>;

  isLive(): boolean;
}

export interface LoadableConfigService extends ConfigService {
  load(): Promise<void>;
}
