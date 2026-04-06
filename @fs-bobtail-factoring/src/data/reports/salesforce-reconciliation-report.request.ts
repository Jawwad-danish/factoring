import { Expose } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';
import { BaseReportCreateRequest } from '../common';
import { ReportName } from './report-name';

export class SalesforceReconciliationReportRequest extends BaseReportCreateRequest<SalesforceReconciliationReportRequest> {
  constructor(source?: Partial<SalesforceReconciliationReportRequest>) {
    super(source);
    this.name = ReportName.SalesforceReconciliation;
  }

  @Expose()
  @IsOptional()
  @IsString()
  s3Bucket?: string;

  @Expose()
  @IsOptional()
  @IsString()
  s3Key?: string;
}
