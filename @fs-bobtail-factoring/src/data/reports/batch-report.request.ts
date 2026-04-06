import { Type } from 'class-transformer';
import { IsArray, IsDate, IsEnum, IsNotEmpty } from 'class-validator';
import { BaseReportCreateRequest } from '../common';
import { BrokerPaymentType } from '../common/types';
import { ReportName } from './report-name';

export class BatchReportRequest extends BaseReportCreateRequest<BatchReportRequest> {
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  date!: Date;

  @IsNotEmpty()
  @IsEnum(BrokerPaymentType, { each: true })
  @IsArray()
  paymentTypes!: BrokerPaymentType[];

  constructor(source?: Partial<BatchReportRequest>) {
    super(source);
    this.name = ReportName.Batch;
  }
}

