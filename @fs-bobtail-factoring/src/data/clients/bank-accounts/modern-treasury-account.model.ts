import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { BaseModel } from '../../common';

export enum CounterPartyStatus {
  PENDING_VERIFICATION = 'pending_verification',
  UNVERIFIED = 'unverified',
  VERIFIED = 'verified',
}

export class ModernTreasuryAccount extends BaseModel<ModernTreasuryAccount> {
  @Expose()
  @ApiProperty({
    required: false,
  })
  id!: string;

  @Expose()
  @ApiProperty()
  externalAccountId!: string;

  @Expose()
  @IsEnum(CounterPartyStatus)
  @ApiProperty({
    enum: CounterPartyStatus,
    enumName: 'CounterPartyStatus',
  })
  status!: CounterPartyStatus;

  @Expose()
  @ApiProperty()
  confirmedWire!: boolean;

  @Expose()
  @ApiProperty()
  account!: string;

  @Expose()
  @ApiProperty()
  routingNumber!: null | string;

  @Expose()
  @ApiProperty()
  wireRoutingNumber!: null | string;
}
