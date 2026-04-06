import { BaseReportCreateRequest } from '../common';
import { IsBoolean, IsDate, IsNotEmpty, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ReportName } from './report-name';

export class BrokerAgingReportCreateRequest extends BaseReportCreateRequest<BrokerAgingReportCreateRequest> {
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  date!: Date;

  @IsOptional()
  @IsBoolean()
  includeAddress?: boolean;

  constructor(source?: Partial<BrokerAgingReportCreateRequest>) {
    super(source);
    this.name = ReportName.BrokerAging;
  }
}
