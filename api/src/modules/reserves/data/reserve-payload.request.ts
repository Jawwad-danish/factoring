import { BaseModel } from '@core/data';
import { BrokerPaymentType } from '@module-persistence/entities';
import { Exclude, Expose, Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export enum ReservePayloadType {
  ReleaseOfFunds = 'releaseOfFunds',
  ReleaseOfFundsTo3rdParty = 'releaseOfFundsTo3rdParty',
  NonFactoredPayment = 'nonFactoredPayment',
  ClientCredit = 'clientCredit',
  Overadvance = 'overadvance',
  DirectPaymentByClient = 'directPaymentByClient',
  WriteOff = 'writeOff',
  Fee = 'fee',
  BrokerClaim = 'brokerClaim',
  TransferFromPositive = 'transferFromPositive',
  TransferToPositive = 'transferToPositive',
  TransferFrom = 'transferFrom',
  TransferTo = 'transferTo',
}

@Exclude()
export abstract class BaseReservePayload<T> extends BaseModel<T> {
  @IsEnum(ReservePayloadType)
  @Expose({ name: '__payloadType' })
  payloadType: ReservePayloadType;
}

@Exclude()
export class ReleaseOfFundsPayload extends BaseReservePayload<ReleaseOfFundsPayload> {}
@Exclude()
export class ReleaseOfFundsTo3rdPartyReservePayload extends BaseReservePayload<ReleaseOfFundsTo3rdPartyReservePayload> {
  @IsString()
  @Expose()
  thirdParty: string;
}
@Exclude()
export class DirectPaymentByClientPayload extends BaseReservePayload<DirectPaymentByClientPayload> {
  @IsDate()
  @Type(() => Date)
  @Expose()
  receivedDate: Date;
}
@Exclude()
export class OveradvanceReservePayload extends BaseReservePayload<OveradvanceReservePayload> {}

@Exclude()
export class NonFactoredPaymentReservePayload extends BaseReservePayload<NonFactoredPaymentReservePayload> {
  @IsString()
  @Expose()
  loadNumber: string;

  @IsEnum(BrokerPaymentType)
  @Expose()
  type: BrokerPaymentType;

  @IsUUID()
  @IsOptional()
  @Expose()
  brokerId: string;

  @IsString()
  @Expose()
  brokerName: string;

  @IsDate()
  @Type(() => Date)
  @Expose()
  batchDate: Date;

  @IsString()
  @IsOptional()
  @Expose()
  checkNumber?: string;
}

@Exclude()
export class ClientCreditReservePayload extends BaseReservePayload<ClientCreditReservePayload> {}

@Exclude()
export class WriteOffPayload extends BaseReservePayload<WriteOffPayload> {}

@Exclude()
export class BrokerClaimPayload extends BaseReservePayload<BrokerClaimPayload> {
  @IsUUID()
  @IsOptional()
  @Expose()
  brokerId?: string;
}

@Exclude()
export class FeeReservePayload extends BaseReservePayload<FeeReservePayload> {}

@Exclude()
export class TransferFromPayload extends BaseReservePayload<TransferFromPayload> {
  @IsNotEmpty()
  @IsUUID()
  @Expose()
  transferClientId: string;
}

@Exclude()
export class TransferToPayload extends BaseReservePayload<TransferToPayload> {}

export type ReservePayload =
  | ReleaseOfFundsPayload
  | ReleaseOfFundsTo3rdPartyReservePayload
  | NonFactoredPaymentReservePayload
  | ClientCreditReservePayload
  | OveradvanceReservePayload
  | DirectPaymentByClientPayload
  | WriteOffPayload
  | FeeReservePayload
  | TransferFromPayload
  | TransferToPayload;
