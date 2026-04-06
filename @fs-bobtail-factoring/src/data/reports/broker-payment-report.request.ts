import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty } from 'class-validator';
import { BaseReportCreateRequest } from '../common';
import { ReportName } from './report-name';

export class BrokerPaymentReportRequest extends BaseReportCreateRequest<BrokerPaymentReportRequest> {
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  startDate!: Date;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  endDate!: Date;

  constructor(source?: Partial<BrokerPaymentReportRequest>) {
    super(source);
    this.name = ReportName.BrokerPayment;
  }
}
