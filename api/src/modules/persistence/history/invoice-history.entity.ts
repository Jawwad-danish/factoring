import { TransformFromBig, TransformToBig } from '@core/decorators';
import { Entity, Enum, Property } from '@mikro-orm/core';
import Big from 'big.js';
import { Type } from 'class-transformer';
import { BigJsType } from '../entities/big.type';
import {
  BrokerPaymentStatus,
  ClientPaymentStatus,
  InvoiceStatus,
  VerificationStatus,
} from '../entities/invoice.entity';
import { HistoryEntity } from './history.entity';

@Entity({ tableName: 'invoices_history' })
export class InvoiceHistoryEntity extends HistoryEntity {
  @Property({ type: 'uuid', nullable: false })
  clientId: string;

  @Property({ type: 'uuid', nullable: true })
  brokerId: string | null;

  @Property({ type: 'varchar', nullable: false })
  displayId: string;

  @Property({ type: 'varchar', nullable: true })
  buyoutId: null | string;

  @Property({ type: 'varchar', nullable: false })
  loadNumber: string;

  @TransformToBig()
  @TransformFromBig()
  @Type(() => String)
  @Property({ type: BigJsType, nullable: false })
  lineHaulRate: Big = Big(0);

  @TransformToBig()
  @TransformFromBig()
  @Type(() => String)
  @Property({ type: BigJsType, nullable: false })
  lumper: Big;

  @TransformToBig()
  @TransformFromBig()
  @Type(() => String)
  @Property({ type: BigJsType, nullable: false })
  detention: Big;

  @TransformToBig()
  @TransformFromBig()
  @Type(() => String)
  @Property({ type: BigJsType, nullable: false })
  advance: Big;

  @Property({ type: 'timestamp', nullable: true })
  paymentDate: null | Date;

  @Property({ type: 'boolean' })
  expedited: boolean;

  @TransformToBig()
  @TransformFromBig()
  @Type(() => String)
  @Property({ type: BigJsType, nullable: false, default: 0 })
  accountsReceivableValue: Big = Big(0);

  @TransformToBig()
  @TransformFromBig()
  @Type(() => String)
  @Property({ type: BigJsType, nullable: false })
  value: Big;

  @TransformToBig()
  @TransformFromBig()
  @Type(() => String)
  @Property({ type: BigJsType, nullable: false, default: 0 })
  approvedFactorFeePercentage: Big = Big(0);

  @TransformToBig()
  @TransformFromBig()
  @Type(() => String)
  @Property({ type: BigJsType, nullable: false, default: 0 })
  approvedFactorFee: Big = Big(0);

  @TransformToBig()
  @TransformFromBig()
  @Type(() => String)
  @Property({ type: BigJsType, nullable: false, default: 0 })
  reserveRatePercentage: Big = Big(0);

  @TransformToBig()
  @TransformFromBig()
  @Type(() => String)
  @Property({ type: BigJsType, nullable: false, default: 0 })
  reserveFee: Big = Big(0);

  @TransformToBig()
  @TransformFromBig()
  @Type(() => String)
  @Property({ type: BigJsType, nullable: false, default: 0 })
  deduction: Big = Big(0);

  @Property({ type: 'varchar', nullable: true })
  memo: string;

  @Property({ type: 'varchar', nullable: true })
  note: null | string;

  @Enum({
    items: () => InvoiceStatus,
    nullable: false,
  })
  status: InvoiceStatus;

  @Property({ type: 'timestamp', nullable: true })
  rejectedDate: Date | null;

  @Property({ type: 'timestamp', nullable: true })
  purchasedDate: Date | null;

  @Enum({
    items: () => BrokerPaymentStatus,
    nullable: false,
    default: BrokerPaymentStatus.NotReceived,
  })
  brokerPaymentStatus: BrokerPaymentStatus = BrokerPaymentStatus.NotReceived;

  @Enum({
    items: () => ClientPaymentStatus,
    nullable: false,
    default: ClientPaymentStatus.NotApplicable,
  })
  clientPaymentStatus: ClientPaymentStatus = ClientPaymentStatus.NotApplicable;

  @Enum({
    items: () => VerificationStatus,
    nullable: false,
    default: VerificationStatus.Required,
  })
  verificationStatus: VerificationStatus = VerificationStatus.Required;
}
