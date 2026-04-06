import { BaseModel } from '@core/data';
import { Expose, Type } from 'class-transformer';
import { TimeRangeMetrics } from '@common/data';

export class InvoiceRiskClient extends BaseModel<InvoiceRiskClient> {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  mc: string;

  @Expose()
  dot: string;

  @Expose()
  email: string;

  @Expose()
  totalOutstandingAging: number;

  @Expose()
  brokerConcentration: number;

  @Expose()
  @Type(() => TimeRangeMetrics)
  totalBrokers: TimeRangeMetrics;

  @Expose()
  @Type(() => TimeRangeMetrics)
  dilution: TimeRangeMetrics;

  @Expose()
  @Type(() => TimeRangeMetrics)
  daysToPay: TimeRangeMetrics;
}

export class InvoiceRiskBroker extends BaseModel<InvoiceRiskBroker> {
  @Expose()
  id: null | string;

  @Expose()
  name: null | string;

  @Expose()
  mc: string;

  @Expose()
  dot: string;

  @Expose()
  phone: string;

  @Expose()
  email: string;

  @Expose()
  displayRating: string;

  @Expose()
  totalOutstandingAging: number;

  @Expose()
  totalClientsWorkingWith: number;

  @Expose()
  @Type(() => Date)
  lastPaymentDate: Date | null;

  @Expose()
  @Type(() => TimeRangeMetrics)
  dilution: TimeRangeMetrics;

  @Expose()
  @Type(() => TimeRangeMetrics)
  daysToPay: TimeRangeMetrics;
}

export class InvoiceRisk extends BaseModel<InvoiceRisk> {
  @Expose()
  @Type(() => InvoiceRiskClient)
  client: InvoiceRiskClient;

  @Expose()
  @Type(() => InvoiceRiskBroker)
  broker: null | InvoiceRiskBroker;
}
