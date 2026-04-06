
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { BaseModel } from '../common';
import { TransferType } from './transfer-type';

export class CreatePaymentOrderRequest extends BaseModel<CreatePaymentOrderRequest> {
  @Expose()
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({
    title: 'Client ID',
    description: 'Which client we want to debit',
    required: true,
    format: 'uuid',
  })
  clientId!: string;

  @Expose()
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({
    title: 'Bank account ID',
    description: 'Which bank account we want to debit',
    required: true,
    format: 'uuid',
  })
  bankAccountId!: string;

  @Expose()
  @IsNotEmpty()
  @IsEnum(TransferType)
  @ApiProperty({
    title: 'Payment transfer type',
    description: 'Payment transfer type',
    required: true,
    format: 'string',
  })
  transferType!: TransferType;

  @Expose()
  @IsNotEmpty()
  @ApiProperty({
    title: 'Payment amount',
    type: 'number',
    example: 100,
    required: true,
    description: 'Payment amount $10 would be represented as 1000 (cents). ',
    format: 'string',
  })
  amount!: number;
}
