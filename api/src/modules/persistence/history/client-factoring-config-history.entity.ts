import { Entity, Enum, Index, Property } from '@mikro-orm/core';
import Big from 'big.js';
import { ClientFactoringStatus } from '../entities';
import { BigJsType } from '../entities/big.type';
import { HistoryEntity } from './history.entity';

@Entity({ tableName: 'client_factoring_configs_history' })
export class ClientFactoringConfigsHistoryEntity extends HistoryEntity {
  @Index()
  @Property({ type: 'uuid', nullable: false })
  clientId: string;

  @Property({ type: BigJsType, nullable: true })
  clientLimitAmount: null | Big;

  @Property({ type: BigJsType, nullable: false })
  factoringRatePercentage: Big;

  @Property({ type: BigJsType, nullable: false })
  reserveRatePercentage: Big;

  @Property({ type: BigJsType, nullable: false })
  verificationPercentage: Big = Big(1);

  @Property({ type: Boolean, nullable: false })
  vip = false;

  @Property({ type: Boolean, nullable: false })
  requiresVerification = false;

  @Property({
    type: Boolean,
    nullable: false,
  })
  expediteTransferOnly = false;

  @Property({
    type: Boolean,
    nullable: false,
  })
  doneSubmittingInvoices = false;

  @Property({ type: 'uuid' })
  clientSuccessTeamId: string;

  @Enum({
    items: () => ClientFactoringStatus,
    nullable: false,
    default: ClientFactoringStatus.Onboarding,
  })
  status: ClientFactoringStatus = ClientFactoringStatus.Onboarding;

  @Property({ type: 'uuid' })
  userId: string;

  @Property({
    type: Boolean,
    nullable: false,
  })
  acceptedFeeIncrease: boolean;

  @Property({
    type: Boolean,
    nullable: false,
  })
  ccInEmails: boolean;

  // Insurance
  @Property({ type: String, nullable: true })
  insuranceAgency: string | null;

  @Property({ type: String, nullable: true })
  insuranceCompany: string | null;

  @Property({ type: BigJsType, nullable: true })
  insuranceMonthlyPaymentPerTruck: Big | null;

  @Property({ type: 'timestamp', length: 3, nullable: true })
  insuranceRenewalDate: Date | null;

  // Underwriting
  @Property({ type: Boolean, nullable: false, default: false })
  ofacVerified: boolean = false;

  @Property({ type: Boolean, nullable: false, default: false })
  carrier411Alerts: boolean = false;

  @Property({ type: Boolean, nullable: false, default: false })
  taxGuardAlerts: boolean = false;

  // Fleet
  @Property({ type: Number, nullable: false, default: 0 })
  dryvanTrucksAmount: number = 0;

  @Property({ type: Number, nullable: false, default: 0 })
  refrigeratedTrucksAmount: number = 0;

  @Property({ type: Number, nullable: false, default: 0 })
  flatbedTrucksAmount: number = 0;

  @Property({ type: Number, nullable: false, default: 0 })
  stepdeckTrucksAmount: number = 0;

  @Property({ type: Number, nullable: false, default: 0 })
  leasedTrucksAmount: number = 0;

  @Property({ type: Number, nullable: false, default: 0 })
  otherTrucksAmount: number = 0;
}
