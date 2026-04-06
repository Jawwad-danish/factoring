import { BaseReportCreateRequest } from "../common";
import { IsDate, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ReportName } from './report-name';

export class ReconciliationReportRequest extends BaseReportCreateRequest<ReconciliationReportRequest> {

  constructor(source?: Partial<ReconciliationReportRequest>) {
    super(source);
    this.name = ReportName.Reconciliation;
  }

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  startDate!: Date;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  endDate!: Date;

  @IsOptional()
  @IsString()
  title?: string;
}
