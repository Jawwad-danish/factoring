import { V1AwareBaseModel } from '@core/data';
import { TransformFromBig, TransformToBig } from '@core/decorators';
import { BrokerPaymentType } from '@module-persistence/entities';
import { ApiProperty } from '@nestjs/swagger';
import Big from 'big.js';
import { Expose, Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { TagRequest } from './assign-tag.request';

export class CreateBrokerPaymentRequest extends V1AwareBaseModel<CreateBrokerPaymentRequest> {
  @IsOptional()
  @IsUUID()
  @Expose()
  @ApiProperty({
    title: 'Broker payment ID',
    description: 'When we want to create an broker payment with a certain ID',
    format: 'uuid',
  })
  id?: string;

  @IsUUID()
  @Expose()
  @ApiProperty({
    title: 'Invoice ID',
    description: 'The invoice ID',
  })
  invoiceId: string;

  @IsOptional()
  @IsEnum(BrokerPaymentType)
  @Expose()
  @ApiProperty({
    title: 'Broker payment type',
    description: 'The broker payment type',
    enum: BrokerPaymentType,
  })
  type?: BrokerPaymentType;

  @IsNotEmpty()
  @TransformToBig()
  @TransformFromBig()
  @Type(() => String)
  @ApiProperty({
    title: 'Broker payment amount',
    description: 'The broker payment amount in pennies',
    type: 'string',
    pattern: '[0-9]+',
    example: '100',
  })
  amount: Big = Big(0);

  @IsString()
  @IsOptional()
  @Expose()
  @ApiProperty({
    title: 'Broker payment check number',
    description: 'The broker payment check number',
    required: false,
  })
  checkNumber?: string;

  @IsDate()
  @Type(() => Date)
  @Expose()
  @ApiProperty({
    title: 'Broker payment batch date',
    description: 'The broker payment batch date',
    required: false,
  })
  batchDate: Date;

  @IsOptional()
  @ValidateNested()
  @Type(() => TagRequest)
  @ApiProperty({
    title: 'Broker payment tag',
    description: 'The broker payment tag',
    required: false,
  })
  tag?: TagRequest;
}
