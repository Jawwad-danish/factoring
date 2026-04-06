import { V1AwareBaseModel } from '@core/data';
import { IsBigRange, TransformFromBig, TransformToBig } from '@core/decorators';
import { ApiProperty } from '@nestjs/swagger';
import Big from 'big.js';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateReserveAccountFundsRequest extends V1AwareBaseModel<CreateReserveAccountFundsRequest> {
  @IsOptional()
  @IsUUID()
  @ApiProperty({
    title: 'Reserve ID',
    description: 'When we want to create a reserve with a certain ID',
    required: false,
    format: 'uuid',
  })
  id?: string;

  @IsNotEmpty()
  @TransformToBig()
  @TransformFromBig()
  @IsBigRange({ min: -10_000_000, max: 10_000_000 })
  @Type(() => String)
  @ApiProperty({
    title: 'Reserve account funds amount',
    description: 'Unsigned value of the reserve account funds',
    type: 'string',
    pattern: '[0-9]+',
    example: '1200',
    required: true,
  })
  amount: Big;

  @IsString()
  @ApiProperty({
    title: 'Reserve account funds note',
    description: 'Additional information about the reserve account funds',
    required: false,
    maximum: 55,
    example: 'Reserve account funds note',
  })
  note: string;
}
