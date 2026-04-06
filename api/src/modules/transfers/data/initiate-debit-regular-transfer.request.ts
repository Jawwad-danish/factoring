import { V1AwareBaseModel } from '@core/data';
import { TransformToBig } from '@core/decorators';
import { ApiProperty } from '@nestjs/swagger';
import { Big } from 'big.js';
import { Expose, Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class InitiateDebitRegularTransferRequest extends V1AwareBaseModel<InitiateDebitRegularTransferRequest> {
  @IsOptional()
  @IsUUID()
  @Expose()
  @ApiProperty({
    title: 'Debit batch payment ID',
    description:
      'When we want to create a debit batch payment with a certain ID',
    required: false,
    format: 'uuid',
  })
  id?: string;

  @IsUUID()
  @Expose()
  @IsNotEmpty()
  @ApiProperty({
    title: 'Client ID',
    description: 'Which client we want to debit',
    required: true,
    format: 'uuid',
  })
  clientId: string;

  @IsUUID()
  @Expose()
  @IsNotEmpty()
  @ApiProperty({
    title: 'Bank Account ID',
    description: 'Which bank account we want to debit',
    required: true,
    format: 'uuid',
  })
  bankAccountId: string;

  @Expose()
  @IsNotEmpty()
  @Type(() => String)
  @TransformToBig()
  @ApiProperty({
    title: 'Amount',
    description: 'The amount we want to debit',
    required: true,
    type: 'string',
  })
  amount: Big;
}
