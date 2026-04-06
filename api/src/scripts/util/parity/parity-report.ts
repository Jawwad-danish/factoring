import { BasicEntity } from '@module-persistence/entities';
import { BaseReport, ParsingReport } from '../report';

export interface FieldDifference<E extends BasicEntity> {
  key: keyof E;
  v1Value: any;
  v2Value: any;
}
export interface ParityResult {
  convergenceField: string;
  total: {
    matching: number;
    mapping: {
      items: number;
      failed: number;
    };
    missing: number;
    differences: Record<string, number>;
  };
  failedMappedItemIds: Record<string, string>;
  missingItems: {
    flattened: string[];
    expanded: [string, string[]][];
  };
  differences: Record<string, any>[];
}
export class MasterParityReport extends BaseReport {
  private readonly reports: ParityReport<BasicEntity>[] = [];

  addReport<E extends BasicEntity>(
    reportToRegister: ParityReport<E>,
  ): ParityReport<BasicEntity> {
    const existingReport = this.reports.find(
      (report) => report.domain === reportToRegister.domain,
    );
    if (existingReport) {
      return existingReport;
    }
    this.reports.push(reportToRegister as ParityReport<BasicEntity>);
    return reportToRegister as ParityReport<BasicEntity>;
  }

  hasItems(): boolean {
    return this.reports.length > 0;
  }

  asJson(): object {
    const reportsResults = this.reports.map(
      (report) => report.asJson() as ParityResult,
    );
    return {
      total: {
        matching: reportsResults.reduce(
          (total, item) => total + item.total.matching,
          0,
        ),
        mapping: {
          items: reportsResults.reduce(
            (total, item) => total + item.total.mapping.items,
            0,
          ),
          failed: reportsResults.reduce(
            (total, item) => total + item.total.mapping.failed,
            0,
          ),
        },
        missing: reportsResults.reduce(
          (total, item) => total + item.total.missing,
          0,
        ),
        differences: reportsResults.reduce(
          (total, item) =>
            total +
            Object.values(item.total.differences).reduce(
              (total, item) => total + item,
              0,
            ),
          0,
        ),
      },
      reports: reportsResults,
    };
  }

  write(path: string): void {
    return super.write(path, 'parity-report-result');
  }
}
export class ParityReport<E extends BasicEntity> extends ParsingReport {
  private readonly missing: Record<string, string[]> = {};
  private readonly failedMappedItems: Record<string, string> = {};
  private readonly differences: Record<string, FieldDifference<E>[]> = {};
  private statusDisplayInterval: NodeJS.Timeout | null = null;
  private countItemsForMapping = 0;
  private countMatching = 0;
  private countCheckedItems = 0;
  private differencesCount = {};
  private estimatedTotal = 0;
  private isProcessing = false;

  constructor(
    readonly domain: string,
    readonly convergenceField: keyof E,
    readonly enableStatusDisplay = false,
  ) {
    super();
  }

  startProcessing() {
    if (this.isProcessing) {
      return;
    }
    this.isProcessing = true;
    if (this.enableStatusDisplay) {
      this.startProcessingInterval();
    }
  }

  stopProcessing() {
    if (!this.isProcessing) {
      return;
    }
    this.isProcessing = false;
    this.stopProcessingInterval();
    this.logProgress();
  }

  setEstimatedTotal(value: number) {
    console.log(`[${this.domain}] - Setting an estimated total of ${value}`);
    this.estimatedTotal = value;
  }

  addMissing(file: string, v1Object: E) {
    const missingForFile = this.missing[file];
    const convergenceFieldValue = v1Object[this.convergenceField] as string;
    if (missingForFile) {
      missingForFile.push(convergenceFieldValue);
    } else {
      this.missing[file] = [convergenceFieldValue];
    }
  }

  setMissing(file: string, ids: string[]) {
    this.missing[file] = ids;
  }

  addFailedMappedItemId(id: string, cause = '') {
    this.failedMappedItems[id] = cause;
  }

  incrementCountItemsForMapping() {
    this.countItemsForMapping++;
  }

  incrementCountMatching() {
    this.countMatching++;
  }

  incrementCountCheckedItems() {
    this.countCheckedItems++;
  }

  getCountCheckedItems() {
    return this.countCheckedItems;
  }

  addDifference(
    v1Object: E,
    result: FieldDifference<E>,
    differenceMapper?: (result: FieldDifference<E>) => FieldDifference<E>,
  ) {
    const key = result.key as string;
    const convergenceFieldValue = v1Object[this.convergenceField] as string;
    if (this.differencesCount[key]) {
      this.differencesCount[key]++;
    } else {
      this.differencesCount[key] = 1;
    }

    if (this.differences[convergenceFieldValue]) {
      this.differences[convergenceFieldValue].push(
        differenceMapper ? differenceMapper(result) : result,
      );
    } else {
      this.differences[convergenceFieldValue] = [
        differenceMapper ? differenceMapper(result) : result,
      ];
    }
  }

  asJson(): object {
    return {
      domain: this.domain,
      convergenceField: this.convergenceField as string,
      total: {
        matching: this.countMatching,
        mapping: {
          items: this.countItemsForMapping,
          failed: Object.keys(this.failedMappedItems).length,
        },
        missing: Object.values(this.missing).reduce(
          (total, item) => total + item.length,
          0,
        ),
        differences: this.differencesCount,
      },
      failedMappedItemIds: this.failedMappedItems,
      missingItems: {
        flattened: Object.values(this.missing)
          .flatMap((item) => item)
          .flatMap((item) => item),
        expanded: Object.entries(this.missing).filter(
          (entry) => entry[1].length != 0,
        ),
      },
      differences: this.differences,
    };
  }

  hasItems(): boolean {
    return (
      this.countMatching != 0 ||
      this.countItemsForMapping != 0 ||
      Object.keys(this.missing).length != 0 ||
      Object.keys(this.failedMappedItems).length != 0 ||
      Object.keys(this.differences).length != 0
    );
  }

  write(path: string): void {
    this.stopProcessingInterval();
    console.log(
      `[${this.domain}] - Checked count: ${this.countCheckedItems} | Actual total: ${this.countItemsForMapping}`,
    );
    super.write(path, `parity-${this.domain}`);
  }

  private logProgress() {
    console.log(
      `[${this.domain}] - Checked count: ${this.countCheckedItems} | Estimated total: ${this.estimatedTotal}`,
    );
  }

  private startProcessingInterval() {
    if (!this.statusDisplayInterval) {
      this.statusDisplayInterval = setInterval(() => {
        this.logProgress();
      }, 5000);
    }
  }

  private stopProcessingInterval() {
    if (this.statusDisplayInterval) {
      clearInterval(this.statusDisplayInterval);
    }
  }
}
