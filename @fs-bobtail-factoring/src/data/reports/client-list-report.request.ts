import { ReportName } from './report-name';
import { IsDate, IsNotEmpty } from 'class-validator';
import { BaseReportCreateRequest } from '../common';
import { Type } from 'class-transformer';

export class ClientListReportRequest extends BaseReportCreateRequest<ClientListReportRequest> {
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  endDate!: Date;

  constructor(source?: Partial<ClientListReportRequest>) {
    super(source);
    this.name = ReportName.ClientList;
  }
}
