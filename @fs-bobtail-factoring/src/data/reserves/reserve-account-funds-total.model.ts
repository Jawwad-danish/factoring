
import { ApiProperty } from '@nestjs/swagger';
import Big from 'big.js';
import { Exclude, Expose, Type } from 'class-transformer';
import { BaseModel } from '../common';
import { TransformToBig } from '../../validators';

@Exclude()
export class ReserveAccountFundsTotal extends BaseModel<ReserveAccountFundsTotal> {
  @TransformToBig()
  @Type(() => String)
  @Expose()
  @ApiProperty({
    title: 'Reserve account funds total',
    description: 'The reserve account funds total',
  })
  amount: Big;
}
