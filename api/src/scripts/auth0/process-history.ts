import { LogEvent } from 'auth0';
import dayjs from 'dayjs';
import { BaseModel } from '../../core/data/common/base.model';
import { HistoryRepository, HistoryRow } from './history-repository';

const MOBILE_CLIENT_ID = 'QyfGuHG53PbamPmFqQr00FQgwiJR91tS';

class LogEntry extends BaseModel<LogEntry> {
  id?: string;
  country?: string;
  city?: string;
  date?: string;
}

class LogResult extends BaseModel<LogResult> {
  currentLogEvent: LogEntry;
  nextLogEvent: LogEntry;
}

class ProcessedUser {
  readonly countries = new Map<string, number>();
  readonly logResults: LogResult[] = [];

  constructor(readonly email: string) {}

  addAuthenticationCountry(country: string) {
    const count = (this.countries.get(country) || 0) + 1;
    this.countries.set(country, count);
  }

  compareLogEvents(current: LogEvent, next: LogEvent) {
    if (
      current.location_info?.country_code != next.location_info?.country_code &&
      dayjs(current.date).diff(dayjs(next.date), 'd') === 0
    ) {
      this.logResults.push(
        new LogResult({
          currentLogEvent: new LogEntry({
            id: current.log_id,
            city: current.location_info?.city_name,
            country: current.location_info?.country_code,
            date: dayjs(current.date).toISOString(),
          }),
          nextLogEvent: new LogEntry({
            id: next.log_id,
            city: next.location_info?.city_name,
            country: next.location_info?.country_code,
            date: dayjs(next.date).toISOString(),
          }),
        }),
      );
    }
  }
}

function processUser(row: HistoryRow, logs: any[]) {
  const processedUser = new ProcessedUser(row.email);
  for (let i = 0; i < logs.length; i++) {
    const current = logs[i];
    const currentCountry = current?.location_info?.country_code;
    if (currentCountry) {
      processedUser.addAuthenticationCountry(currentCountry);
    }
    if (i === logs.length - 1) {
      continue;
    }
    const next = logs[i + 1];
    processedUser.compareLogEvents(current, next);
  }
  return processedUser;
}

async function run() {
  const repository = await HistoryRepository.init();
  const rows = await repository.findAll();
  const processedUsers: ProcessedUser[] = [];
  for (const row of rows) {
    const logs = row.entries.filter(
      (log) => log.client_id !== MOBILE_CLIENT_ID,
    );
    if (logs.length === 0) {
      console.warn(`User ${row.email} authenticated only from mobile`);
      continue;
    }
    processedUsers.push(processUser(row, logs));
  }
  // Users who authenticated from multiple countries
  processedUsers
    .filter((user) => user.countries.size > 1)
    .forEach((user) => {
      const flattenCountries = Array.from(user.countries.keys()).join(',');
      console.log(`${user.email}, ${flattenCountries}`);
    });

  // Users who authenticated in the same day from different countries
  processedUsers
    .filter((user) => user.logResults.length > 0)
    .forEach((user) => {
      const flattenCountries = Array.from(user.countries.keys()).join(',');
      console.log(`${user.email}, ${flattenCountries}`);
    });
}
run()
  .then(() => console.log('Done'))
  .catch((error) => console.error(error));
