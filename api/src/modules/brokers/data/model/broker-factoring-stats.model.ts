import { AuditBaseModel } from '@core/data';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class BrokerFactoringStats extends AuditBaseModel<BrokerFactoringStats> {
  @Expose()
  @ApiProperty({
    title: 'ID',
    description: 'ID of the broker factoring stats entity',
  })
  id: string;

  @ApiProperty({
    title: 'Broker ID',
    description: 'ID of the broker',
  })
  brokerId: string;

  @Expose()
  @ApiProperty({
    title: 'Average days to pay',
    description:
      'Average of the number of days it takes a broker to pay the invoice from the moment it was purchased',
  })
  averageDaysToPay: number;

  @Expose()
  @ApiProperty({
    title: 'Under review total',
    description:
      'Total value of invoices currently under review for the broker',
  })
  underReviewTotal: number;

  @Expose()
  @ApiProperty({
    title: 'Not received total',
    description:
      'Total value of invoices that have not yet been paid by the broker',
  })
  notReceivedTotal: number;

  @Expose()
  @Expose()
  @ApiProperty({
    title: 'Shortpaid total',
    description:
      'Total value of invoices that were paid with less than the full amount by the broker',
  })
  shortpaidTotal: number;

  @Expose()
  @Expose()
  @ApiProperty({
    title: 'Non payment total',
    description: 'Total value of invoices that will not be paid by the broker',
  })
  nonPaymentTotal: number;
}
