import { IsBig, TransformFromBig, TransformToBig } from '@core/decorators';
import Big from 'big.js';
import { Exclude, Expose, Type } from 'class-transformer';
import {
  IsDefined,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import {
  BaseReservePayload,
  ClientCreditReservePayload,
  DirectPaymentByClientPayload,
  NonFactoredPaymentReservePayload,
  OveradvanceReservePayload,
  ReleaseOfFundsPayload,
  ReleaseOfFundsTo3rdPartyReservePayload,
  ReservePayload,
  ReservePayloadType,
  WriteOffPayload,
  FeeReservePayload,
  BrokerClaimPayload,
  TransferToPayload,
  TransferFromPayload,
} from './reserve-payload.request';
import { ApiProperty } from '@nestjs/swagger';
import { V1AwareBaseModel } from '@core/data';

@Exclude()
export class CreateReserveRequest extends V1AwareBaseModel<CreateReserveRequest> {
  @IsOptional()
  @IsUUID()
  @Expose()
  @ApiProperty({
    title: 'Reserve ID',
    description: 'When we want to create a reserve with a certain ID',
    required: false,
    format: 'uuid',
  })
  id?: string;

  @IsBig({ only: 'positive' })
  @TransformToBig()
  @TransformFromBig()
  @Expose()
  @ApiProperty({
    title: 'Reserve amount',
    description: 'Signed value of the reserve',
    type: 'string',
    pattern: '[0-9]+',
    example: '1200',
    required: true,
  })
  amount: Big;

  @IsOptional()
  @IsString()
  @Expose()
  @ApiProperty({
    title: 'Reserve note',
    description: 'Additional information about the reserve',
    required: false,
    maximum: 55,
    example: 'Reserve note',
  })
  note?: string;

  @IsDefined()
  @ValidateNested()
  @Expose()
  @Type(() => BaseReservePayload, {
    keepDiscriminatorProperty: true,
    discriminator: {
      property: '__payloadType',
      subTypes: [
        {
          value: ReleaseOfFundsPayload,
          name: ReservePayloadType.ReleaseOfFunds,
        },
        {
          value: ReleaseOfFundsTo3rdPartyReservePayload,
          name: ReservePayloadType.ReleaseOfFundsTo3rdParty,
        },
        {
          value: NonFactoredPaymentReservePayload,
          name: ReservePayloadType.NonFactoredPayment,
        },
        {
          value: ClientCreditReservePayload,
          name: ReservePayloadType.ClientCredit,
        },
        {
          value: OveradvanceReservePayload,
          name: ReservePayloadType.Overadvance,
        },
        {
          value: DirectPaymentByClientPayload,
          name: ReservePayloadType.DirectPaymentByClient,
        },
        {
          value: WriteOffPayload,
          name: ReservePayloadType.WriteOff,
        },
        {
          value: FeeReservePayload,
          name: ReservePayloadType.Fee,
        },
        {
          value: BrokerClaimPayload,
          name: ReservePayloadType.BrokerClaim,
        },
        {
          value: TransferToPayload,
          name: ReservePayloadType.TransferToPositive,
        },

        {
          value: TransferFromPayload,
          name: ReservePayloadType.TransferFromPositive,
        },
        {
          value: TransferToPayload,
          name: ReservePayloadType.TransferTo,
        },

        {
          value: TransferFromPayload,
          name: ReservePayloadType.TransferFrom,
        },
      ],
    },
  })
  payload: ReservePayload;
}
