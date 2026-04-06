import * as fs from 'fs';

export interface Report {
  asJson(): object;

  hasItems(): boolean;

  write(path: string): void;
}

export abstract class BaseReport implements Report {
  abstract asJson(): object;

  abstract hasItems(): boolean;

  write(path: string, name = 'result'): void {
    fs.writeFileSync(
      `${path}/${name}-${Date.now()}.json`,
      JSON.stringify(this.asJson(), null, 4),
    );
  }
}

export class EmptyReport extends BaseReport implements Report {
  asJson(): object {
    return {};
  }

  hasItems(): boolean {
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  write(_path: string, _name?: string): void {}
}

export abstract class ParsingReport extends BaseReport {
  protected readonly failedParsedFiles: string[] = [];

  addFailedParsedFiles(file: string) {
    this.failedParsedFiles.push(file);
  }
}

export class FileReport extends BaseReport {
  private readonly failedMappedItems: Record<string, string> = {};
  private readonly failedSavedEntities: Record<string, string> = {};
  private countItemsForMapping = 0;

  constructor(readonly file: string) {
    super();
  }

  addFailedMappedItemId(id: string, cause = '') {
    this.failedMappedItems[id] = cause;
  }

  addFailedSavedEntityId(id: string, cause: string) {
    this.failedSavedEntities[id] = cause;
  }

  incrementCountItemsForMapping() {
    this.countItemsForMapping++;
  }

  asJson(): object {
    return {
      file: this.file,
      total: {
        mapping: {
          items: this.countItemsForMapping,
          failed: Object.keys(this.failedMappedItems).length,
        },
        persistence: {
          items:
            this.countItemsForMapping -
            Object.keys(this.failedMappedItems).length,
          failed: Object.keys(this.failedSavedEntities).length,
        },
      },
      failedMappedItemIds: this.failedMappedItems,
      failedSavedEntityIds: this.failedSavedEntities,
    };
  }

  hasItems(): boolean {
    return (
      Object.keys(this.failedMappedItems).length != 0 ||
      Object.keys(this.failedSavedEntities).length != 0 ||
      this.countItemsForMapping != 0
    );
  }
}

export class DomainReport extends ParsingReport implements ParsingReport {
  private readonly reports: FileReport[] = [];
  private totalFilesForParsing = 0;

  constructor(readonly domain: string) {
    super();
  }

  ofFile(file: string) {
    let report = this.reports.find((report) => report.file === file);
    if (!report) {
      report = new FileReport(file);
      this.reports.push(report);
    }
    return report;
  }

  setTotalFilesForParsing(total: number) {
    this.totalFilesForParsing = total;
  }

  asJson(): object {
    return {
      domain: this.domain,
      total: {
        filesForParsing: this.totalFilesForParsing,
        failedParsedFiles: this.failedParsedFiles.length,
      },
      failedParsedFiles: this.failedParsedFiles,
      fileReports: this.reports
        .filter((report) => report.hasItems())
        .map((report) => report.asJson()),
    };
  }

  hasItems(): boolean {
    return this.reports.length != 0 || this.failedParsedFiles.length != 0;
  }
}

export class ImportReport extends BaseReport {
  private readonly reports: DomainReport[] = [];

  ofDomain(domain: string): DomainReport {
    let report = this.reports.find((report) => report.domain === domain);
    if (!report) {
      report = new DomainReport(domain);
      this.reports.push(report);
    }
    return report;
  }

  asJson(): object {
    return {
      reports: this.reports
        .filter((report) => report.hasItems())
        .map((report) => report.asJson()),
    };
  }

  hasItems(): boolean {
    return this.reports.length != 0;
  }
}
