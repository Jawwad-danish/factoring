import {
  Cascade,
  Collection,
  Entity,
  Enum,
  Index,
  LoadStrategy,
  ManyToOne,
  OneToMany,
  OneToOne,
  Property,
  Unique,
} from '@mikro-orm/core';
import Big from 'big.js';
import { BasicMutableEntity } from './basic-mutable.entity';
import { BigJsType } from './big.type';
import { ClientFactoringRateReasonAssocEntity } from './client-factoring-rate-reason-assoc.entity';
import { ClientFactoringUnderwritingNotesEntity } from './client-factoring-underwriting.entity';
import { ClientLimitAssocEntity } from './client-limit-assoc.entity';
import { ClientPaymentPlanAssocEntity } from './client-payment-plan-assoc.entity';
import { ClientReserveRateReasonAssocEntity } from './client-reserve-rate-reason-assoc.entity';
import { ClientStatusReasonAssocEntity } from './client-status-reason-assoc.entity';
import { ClientSuccessTeamEntity } from './client-success-team.entity';
import { ClientFactoringStatus } from './factoring-config.common';
import { UserEntity } from './user.entity';
import { EmployeeEntity } from './employee.entity';

export enum LeadAttributionType {
  Referral = 'referral',
  Web = 'web',
  Email = 'email',
  ColdCalling = 'cold_calling',
  ExistingCustomer = 'existing_customer',
}

@Entity({ tableName: 'client_factoring_configs' })
export class ClientFactoringConfigsEntity extends BasicMutableEntity {
  @Index()
  @Unique()
  @Property({ type: 'uuid', nullable: false })
  clientId: string;

  @Property({ type: BigJsType, nullable: false })
  factoringRatePercentage: Big;

  @Property({ type: BigJsType, nullable: false, default: 0 })
  reserveRatePercentage: Big;

  @Property({ type: BigJsType, nullable: false, default: 1 })
  verificationPercentage: Big = Big(1);

  @Property({ type: Boolean, nullable: false, default: false })
  vip = false;

  @Property({ type: Boolean, nullable: false, default: false })
  requiresVerification = false;

  @Property({
    type: BigJsType,
    nullable: true,
    comment: `Threshold for a client's invoice amount in aging`,
  })
  clientLimitAmount: null | Big = null;

  @Enum({
    items: () => LeadAttributionType,
    nullable: true,
  })
  leadAttribution: LeadAttributionType | null;

  @Property({
    nullable: true,
    comment: `Payment plan for the client`,
    type: 'text',
  })
  paymentPlan: null | string = null;

  @Property({
    type: Boolean,
    nullable: false,
    default: false,
    comment:
      'Used for setting the trasfer type of incoming and not paid to the client invoices to expedite',
  })
  expediteTransferOnly = false;

  @Property({
    type: Boolean,
    nullable: false,
    default: false,
    comment:
      'Used for letting the employees know if the client finished submitting invoices for the day',
  })
  doneSubmittingInvoices = false;

  @Index()
  @ManyToOne({
    entity: () => ClientSuccessTeamEntity,
    eager: true,
    nullable: false,
    strategy: LoadStrategy.JOINED,
  })
  clientSuccessTeam: ClientSuccessTeamEntity;

  @Enum({
    items: () => ClientFactoringStatus,
    nullable: false,
    default: ClientFactoringStatus.Onboarding,
  })
  status: ClientFactoringStatus = ClientFactoringStatus.Onboarding;

  @Index()
  @OneToMany(() => ClientStatusReasonAssocEntity, (status) => status.config, {
    cascade: [Cascade.ALL],
    lazy: true,
    orphanRemoval: true,
    orderBy: {
      createdAt: 'desc',
    },
    strategy: LoadStrategy.SELECT_IN,
  })
  statusHistory = new Collection<ClientStatusReasonAssocEntity>(this);

  @OneToMany(
    () => ClientFactoringRateReasonAssocEntity,
    (factoringRate) => factoringRate.config,
    {
      cascade: [Cascade.ALL],
      lazy: true,
      orphanRemoval: true,
      orderBy: {
        createdAt: 'desc',
      },
      strategy: LoadStrategy.SELECT_IN,
    },
  )
  factoringRateHistory = new Collection<ClientFactoringRateReasonAssocEntity>(
    this,
  );

  @Index()
  @OneToMany(
    () => ClientReserveRateReasonAssocEntity,
    (reserveRate) => reserveRate.config,
    {
      cascade: [Cascade.ALL],
      lazy: true,
      orphanRemoval: true,
      orderBy: {
        createdAt: 'desc',
      },
      strategy: LoadStrategy.SELECT_IN,
    },
  )
  reserveRateHistory = new Collection<ClientReserveRateReasonAssocEntity>(this);

  @Index()
  @OneToMany(
    () => ClientLimitAssocEntity,
    (reserveRate) => reserveRate.config,
    {
      cascade: [Cascade.ALL],
      lazy: true,
      orphanRemoval: true,
      orderBy: {
        createdAt: 'desc',
      },
      strategy: LoadStrategy.SELECT_IN,
    },
  )
  clientLimitHistory = new Collection<ClientLimitAssocEntity>(this);

  @Index()
  @OneToMany(
    () => ClientPaymentPlanAssocEntity,
    (paymentPlan) => paymentPlan.config,
    {
      cascade: [Cascade.ALL],
      lazy: true,
      orphanRemoval: true,
      orderBy: {
        createdAt: 'desc',
      },
      strategy: LoadStrategy.SELECT_IN,
    },
  )
  paymentPlanHistory = new Collection<ClientPaymentPlanAssocEntity>(this);

  @Property({ persist: false })
  get userId(): string {
    return this.user!.id;
  }

  @Index()
  @OneToOne({
    entity: () => UserEntity,
    nullable: false,
    eager: true,
  })
  user: UserEntity;

  @Property({
    type: Boolean,
    nullable: false,
    default: false,
    comment:
      'Used to show the users acceptance of the client factoring fee increase',
  })
  acceptedFeeIncrease = false;

  @Property({
    type: Boolean,
    nullable: false,
    default: false,
    comment:
      'Used for including clients email in cc for NOA emails and invoice delivery emails',
  })
  ccInEmails = false;

  @Index()
  @ManyToOne({
    entity: () => EmployeeEntity,
    nullable: true,
    eager: true,
  })
  salesRep: EmployeeEntity | null;

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

  @Index()
  @OneToMany(
    () => ClientFactoringUnderwritingNotesEntity,
    (underwriting) => underwriting.config,
    {
      cascade: [Cascade.ALL],
      lazy: true,
      orphanRemoval: true,
      orderBy: {
        createdAt: 'desc',
      },
    },
  )
  underwriting = new Collection<ClientFactoringUnderwritingNotesEntity>(this);

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

  @Property({ persist: false })
  get totalTrucksAmount(): number {
    return (
      this.dryvanTrucksAmount +
      this.refrigeratedTrucksAmount +
      this.flatbedTrucksAmount +
      this.stepdeckTrucksAmount +
      this.leasedTrucksAmount +
      this.otherTrucksAmount
    );
  }

  @Property({ type: 'text', nullable: true })
  quickbooksId: string | null;

  @Property({ type: 'text', nullable: true })
  quickbooksName: string | null;
}
