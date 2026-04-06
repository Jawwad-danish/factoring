import { Repositories } from '@module-persistence/repositories';
import { Client } from 'pg';
import { FieldDifference } from './parity-checker';

export interface ComparisonResult {
  differences: {
    v1ObjectID: string;
    v2ObjectID: string;
    differences: FieldDifference[];
  }[];
  missingInV2: string[];
  reimportClients?: {
    reason: string;
    count: number;
    ids: string[];
  };
}

export abstract class CompareStrategy<
  TData,
  TComparisonResult extends object = ComparisonResult,
> {
  constructor(
    readonly v1Client: Client,
    readonly v2Repositories: Repositories,
    readonly strategyName: string,
  ) {}

  abstract getV1Data(): Promise<TData[]>;
  abstract getV2Data(): Promise<TData[]>;
  abstract compareData(v1Data: TData[], v2Data: TData[]): TComparisonResult;

  async run(): Promise<Record<string, TComparisonResult>> {
    const [v1Data, v2Data] = await Promise.all([
      this.doGetV1Data(),
      this.doGetV2Data(),
    ]);

    this.logSummary(v1Data, v2Data);
    return {
      [this.strategyName]: this.compareData(v1Data, v2Data),
    };
  }

  private async doGetV1Data(): Promise<TData[]> {
    console.log(`[V1][${this.strategyName}] Fetching data...`);
    const v1Data = await this.getV1Data();
    console.log(`[V1][${this.strategyName}] - data count: ${v1Data.length}`);
    return v1Data;
  }

  private async doGetV2Data(): Promise<TData[]> {
    console.log(`[V2][${this.strategyName}] Fetching data...`);
    const v2Data = await this.getV2Data();
    console.log(`[V2][${this.strategyName}] - data count: ${v2Data.length}`);
    return v2Data;
  }

  protected buildEmptyDefaultResult(): ComparisonResult {
    return {
      differences: [],
      missingInV2: [],
    };
  }

  protected logSummary(v1Data: TData[], v2Data: TData[]) {
    if (v1Data.length !== v2Data.length) {
      console.log(
        `\x1b[31m${this.strategyName} - Difference between V1 count and V2 count\x1b[0m`,
      );
    }
  }
}
