import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty } from 'class-validator';
import { BaseReportCreateRequest } from '../common';
import { ReportName } from './report-name';

export class DetailedAgingReportCreateRequest extends BaseReportCreateRequest<DetailedAgingReportCreateRequest> {
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  date!: Date;

  constructor(source?: Partial<DetailedAgingReportCreateRequest>) {
    super(source);
    this.name = ReportName.DetailedAging;
  }
}
