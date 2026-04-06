import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString, IsUUID } from 'class-validator';

export class BrokerPaymentsQuery {
  @IsString()
  @IsUUID()
  @Expose()
  @ApiProperty({
    title: 'Invoice ID',
    description: 'The ID of the invoice for fetching the broker payments',
    format: 'uuid',
  })
  invoiceId: string;
}
