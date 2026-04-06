import { Entity, Enum } from '@mikro-orm/core';
import { BasicMutableEntity } from './basic-mutable.entity';

export enum ClientFactoringRateReason {
  RateCorrection = 'rate_correction',
  RateIncrease = 'rate_increase',
  LowerRateRequest = 'lower_rate_request',
  None = 'none',
}

@Entity({ tableName: 'client_factoring_rate_reasons' })
export class ClientFactoringRateReasonEntity extends BasicMutableEntity {
  @Enum({
    items: () => ClientFactoringRateReason,
    nullable: false,
    default: ClientFactoringRateReason.None,
  })
  reason: ClientFactoringRateReason = ClientFactoringRateReason.None;
}
