import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty } from 'class-validator';
import { BaseReportCreateRequest } from '../common';
import { ReportName } from './report-name';

export class ClientAccountSummaryReportRequest extends BaseReportCreateRequest<ClientAccountSummaryReportRequest> {
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  date!: Date;

  constructor(source?: Partial<ClientAccountSummaryReportRequest>) {
    super(source);
    this.name = ReportName.ClientAccountSummary;
  }
}
