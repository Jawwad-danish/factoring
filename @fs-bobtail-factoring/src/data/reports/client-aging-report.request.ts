import { Type } from 'class-transformer';
import { IsDate } from 'class-validator';
import { BaseReportCreateRequest } from '../common';
import { ReportName } from './report-name';

export class ClientAgingReportRequest extends BaseReportCreateRequest<ClientAgingReportRequest> {
  @Type(() => Date)
  @IsDate()
  date!: Date;

  constructor(source?: Partial<ClientAgingReportRequest>) {
    super(source);
    this.name = ReportName.ClientAging;
  }
}
