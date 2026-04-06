import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsUUID } from 'class-validator';
import { BaseReportCreateRequest } from '../common';
import { ReportName } from './report-name';

export class ClientAnnualReportRequest extends BaseReportCreateRequest<ClientAnnualReportRequest> {
  @IsUUID()
  clientId!: string;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  date!: Date;

  constructor(source?: Partial<ClientAnnualReportRequest>) {
    super(source);
    this.name = ReportName.ClientAnnual;
  }
}
