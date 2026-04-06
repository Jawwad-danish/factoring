import { AuditBaseModel } from '@core/data';
import { TransformFromBig, TransformToBig } from '@core/decorators';
import { BrokerPaymentType } from '@module-persistence/entities';
import { ApiProperty } from '@nestjs/swagger';
import Big from 'big.js';
import { Expose, Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class BrokerPayment extends AuditBaseModel<BrokerPayment> {
  @IsUUID()
  @Expose()
  @ApiProperty({
    title: 'Broker payment ID',
    description: 'The broker payment ID',
    format: 'uuid',
  })
  id: string;

  @IsUUID()
  @IsNotEmpty()
  @Expose()
  @ApiProperty({
    title: 'Invoice ID',
    description: 'The ID of the invoice for this broker payment',
    format: 'uuid',
  })
  invoiceId: string;

  @IsEnum(BrokerPaymentType)
  @Expose()
  @ApiProperty({
    title: 'Broker payment type',
    description: 'The broker payment type',
    enum: BrokerPaymentType,
  })
  type: null | BrokerPaymentType;

  @IsOptional()
  @TransformToBig()
  @TransformFromBig()
  @Type(() => String)
  @ApiProperty({
    title: 'Broker payment amount',
    description: 'The broker payment amount',
    type: 'string',
    pattern: '[0-9]+',
    example: '100',
  })
  amount: Big = Big(0);

  @IsOptional()
  @IsString()
  @Expose()
  @ApiProperty({
    title: 'Broker payment check number',
    description: 'The broker payment check number',
    type: 'string',
    nullable: true,
  })
  checkNumber: null | string;

  @IsOptional()
  @IsDateString()
  @Type(() => Date)
  @Expose()
  @ApiProperty({
    title: 'Broker payment batch date',
    description: 'The broker payment batch date',
    type: 'string',
    nullable: true,
  })
  batchDate: null | Date;
}
