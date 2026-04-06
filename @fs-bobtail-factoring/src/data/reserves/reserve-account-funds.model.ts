import { ApiProperty } from '@nestjs/swagger';
import Big from 'big.js';
import { Exclude, Expose, Type } from 'class-transformer';
import { AuditBaseModel } from '../common';
import { TransformFromBig, TransformToBig } from '../../validators';

@Exclude()
export class ReserveAccountFunds extends AuditBaseModel<ReserveAccountFunds> {
  @Expose()
  @ApiProperty({
    title: 'Reserve account funds ID',
    description: 'The reserve account funds ID',
    format: 'uuid',
  })
  id!: string;

  @Expose()
  @ApiProperty({
    title: 'Client ID',
    description: 'The ID of a Client',
    format: 'uuid',
  })
  clientId!: string;

  @Expose()
  @TransformFromBig()
  @TransformToBig()
  @Type(() => String)
  @ApiProperty({
    title: 'Reserve account funds value',
    description: 'The reserve account funds value',
    type: 'string',
    pattern: '[0-9]+',
    example: '1000',
  })
  amount: Big;

  @Expose()
  @ApiProperty({
    title: 'Reserve account funds note',
    description: 'The reserve account funds note',
  })
  note!: string;
}
