import { Entity, Enum } from '@mikro-orm/core';
import { BasicMutableEntity } from './basic-mutable.entity';

export enum ClientReserveRateReason {
  DilutionRate = 'dilution_rate',
  Volume = 'volume',
  HighRiskBrokers = 'high_risk_brokers',
  GeneralRisk = 'general_risk',
  Other = 'other',
  None = 'none',
}

@Entity({ tableName: 'client_reserve_rate_reasons' })
export class ClientReserveRateReasonEntity extends BasicMutableEntity {
  @Enum({
    items: () => ClientReserveRateReason,
    nullable: false,
    default: ClientReserveRateReason.None,
  })
  reason: ClientReserveRateReason = ClientReserveRateReason.None;
}
