import { ReportName } from './report-name';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty } from 'class-validator';
import { BaseReportCreateRequest } from '../common';

export class NetFundsEmployedReportRequest extends BaseReportCreateRequest<NetFundsEmployedReportRequest> {
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  date!: Date;

  constructor(source?: Partial<NetFundsEmployedReportRequest>) {
    super(source);
    this.name = ReportName.NetFundsEmployed;
  }
}
