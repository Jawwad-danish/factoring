import { BaseModel } from '@core/data';
import { TransformToBig, TransformToString } from '@core/decorators';
import { ApiProperty } from '@nestjs/swagger';
import Big from 'big.js';
import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
export class LastTransfer {
  @Expose()
  @ApiProperty({
    title: 'Last transfer ID',
    description: 'Last transfer ID',
    type: 'string',
  })
  id: string;

  @Expose()
  @TransformToString()
  @ApiProperty({
    title: 'Last transfer amount',
    description: 'Last transfer amount',
    type: 'string',
    pattern: '[0-9]+',
    example: '100',
  })
  amount: Big;
}

@Exclude()
export class ClientOverview extends BaseModel<ClientOverview> {
  @Expose()
  @ApiProperty({
    title: 'Count of invoices that need attention',
    description:
      'The count of invoices that are under review or purchased (but not paid yet to the client) and have invoice issues tags',
    example: '3',
  })
  invoicesNeedsAttentionCount: number;

  @Expose()
  @ApiProperty({
    title: 'Count of invoices that need attention',
    description:
      'The count of invoices that are purchased (payment to the client sent) and have invoice issues tags',
    example: '3',
  })
  invoicesPossibleChargebacksCount: number;

  @Expose()
  @ApiProperty({
    title: 'Count of invoices that are to be processed',
    description:
      "The count of invoices that are under review and approved (but not paid to the client) and don't have invoice issues tags",
    example: '3',
  })
  invoicesProcessingCount: number;

  @Expose()
  @Type(() => LastTransfer)
  @ApiProperty({
    title: 'Last transfer',
    description: 'Last transfer details',
    nullable: true,
  })
  lastTransfer: null | LastTransfer;

  @Expose()
  @TransformToString()
  @TransformToBig()
  @ApiProperty({
    title: 'Total reserves amount',
    description: 'The total reserves for the client',
    type: 'string',
    pattern: '[0-9]+',
    example: '100',
  })
  totalReservesAmount: Big;
}
