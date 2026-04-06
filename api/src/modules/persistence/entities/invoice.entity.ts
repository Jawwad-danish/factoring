import { TransformFromBig, TransformToBig } from '@core/decorators';
import {
  Cascade,
  Collection,
  Entity,
  Enum,
  Formula,
  Index,
  LoadStrategy,
  OneToMany,
  OneToOne,
  Property,
} from '@mikro-orm/core';
import Big from 'big.js';
import { Type } from 'class-transformer';
import { ActivityLogEntity } from './activity-log.entity';
import { BasicMutableEntity } from './basic-mutable.entity';
import { BasicEntitySchema } from './basic.entity';
import { BigJsType } from './big.type';
import { BrokerPaymentEntity } from './broker-payment.entity';
import { InvoiceClientPaymentEntity } from './invoice-client-payment.entity';
import { InvoiceDocumentEntity } from './invoice-document.entity';
import { InvoiceTagEntity } from './invoice-tag.entity';
import { PendingBuyoutEntity } from './pending-buyout.entity';
import { RecordStatus } from './primitive.entity';
import { ReserveInvoiceEntity } from './reserve-invoice.entity';
import { TagDefinitionGroupKey } from './tag-definition-group.entity';

export class InvoiceEntitySchema extends BasicEntitySchema {
  static TABLE_NAME = 'invoices';
  static COLUMN_CLIENT_ID = 'client_id';
  static COLUMN_BROKER_ID = 'broker_id';
  static COLUMN_LOAD_NUMBER = 'load_number';
  static COLUMN_PURCHASED_DATE = 'purchased_date';
  static COLUMN_PAYMENT_DATE = 'payment_date';
  static COLUMN_ACCOUNTS_RECEIVABLE_VALUE = 'accounts_receivable_value';
  static COLUMN_APPROVED_FACTOR_FEE = 'approved_factor_fee';
  static COLUMN_DEDUCTION = 'deduction';
  static COLUMN_LINE_HAUL_RATE = 'line_haul_rate';
  static COLUMN_DISPLAY_ID = 'display_id';
  static COLUMN_RESERVE_FEE = 'reserve_fee';
  static COLUMN_STATUS = 'status';
  static COLUMN_EXPEDITED = 'expedited';
  static COLUMN_BROKER_PAYMENT_STATUS = 'broker_payment_status';
}

export enum InvoiceStatus {
  Purchased = 'purchased',
  UnderReview = 'under_review',
  Rejected = 'rejected',
}

export enum BrokerPaymentStatus {
  ShortPaid = 'shortpaid',
  Overpaid = 'overpaid',
  NonPayment = 'nonpayment',
  InFull = 'in_full',
  NotReceived = 'not_received',
  NonFactoredPayment = 'non_factored_payment',
}

export enum ClientPaymentStatus {
  Pending = 'pending',
  NotApplicable = 'not_applicable',
  InProgress = 'in_progress',
  Sent = 'sent',
  Failed = 'failed',
  Completed = 'completed',
}

export type DetectionInvoiceType = Pick<InvoiceEntity, 'id' | 'loadNumber'>;

export type DetectionInvoiceDocumentType = DetectionInvoiceType & {
  documents: Record<string, string>[];
};

export enum VerificationStatus {
  Required = 'required',
  NotRequired = 'not_required',
  Verified = 'verified',
  Bypassed = 'bypassed',
  InProgress = 'in_progress',
  Failed = 'failed',
}

@Entity({ tableName: InvoiceEntitySchema.TABLE_NAME })
export class InvoiceEntity extends BasicMutableEntity {
  @Index()
  @Property({
    fieldName: InvoiceEntitySchema.COLUMN_CLIENT_ID,
    type: 'uuid',
    nullable: false,
  })
  clientId: string;

  @Index()
  @Property({
    fieldName: InvoiceEntitySchema.COLUMN_BROKER_ID,
    type: 'uuid',
    nullable: true,
  })
  brokerId: string | null;

  @Index()
  @Property({
    type: 'varchar',
    nullable: false,
    name: InvoiceEntitySchema.COLUMN_DISPLAY_ID,
  })
  displayId: string;

  @Index()
  @OneToOne({
    entity: () => PendingBuyoutEntity,
    nullable: true,
    lazy: true,
  })
  buyout?: PendingBuyoutEntity;

  @Index()
  @Index({
    expression:
      'CREATE INDEX IF NOT EXISTS invoices_load_number_gin_index ON invoices USING gin (load_number COLLATE pg_catalog."default" gin_trgm_ops) TABLESPACE pg_default;',
    name: 'invoices_load_number_gin_index',
  })
  @Property({
    fieldName: InvoiceEntitySchema.COLUMN_LOAD_NUMBER,
    type: 'varchar',
    nullable: false,
  })
  loadNumber: string;

  @TransformToBig()
  @TransformFromBig()
  @Type(() => String)
  @Property({ type: BigJsType, nullable: false, default: 0 })
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
  @Property({
    fieldName: InvoiceEntitySchema.COLUMN_ACCOUNTS_RECEIVABLE_VALUE,
    type: BigJsType,
    nullable: false,
    default: 0,
  })
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
  @Property({
    fieldName: InvoiceEntitySchema.COLUMN_APPROVED_FACTOR_FEE,
    type: BigJsType,
    nullable: false,
    default: 0,
  })
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
  @Property({
    fieldName: InvoiceEntitySchema.COLUMN_DEDUCTION,
    type: BigJsType,
    nullable: false,
    default: 0,
  })
  deduction: Big = Big(0);

  @Property({ type: 'varchar', nullable: true })
  memo: string;

  @Property({ type: 'varchar', nullable: true })
  note: null | string;

  @Index()
  @Enum({
    items: () => InvoiceStatus,
    nullable: false,
  })
  status: InvoiceStatus;

  @Property({ type: 'timestamp', nullable: true })
  rejectedDate: Date | null;

  @Property({
    fieldName: InvoiceEntitySchema.COLUMN_PURCHASED_DATE,
    type: 'timestamp',
    nullable: true,
  })
  purchasedDate: Date | null;

  @Index()
  @Enum({
    items: () => BrokerPaymentStatus,
    nullable: false,
    default: BrokerPaymentStatus.NotReceived,
  })
  brokerPaymentStatus: BrokerPaymentStatus = BrokerPaymentStatus.NotReceived;

  @Index()
  @Enum({
    items: () => ClientPaymentStatus,
    nullable: false,
    default: ClientPaymentStatus.NotApplicable,
  })
  clientPaymentStatus: ClientPaymentStatus = ClientPaymentStatus.NotApplicable;

  @Index()
  @Enum({
    items: () => VerificationStatus,
    nullable: false,
    default: VerificationStatus.Required,
  })
  verificationStatus: VerificationStatus = VerificationStatus.Required;

  @OneToMany(() => InvoiceDocumentEntity, (document) => document.invoice, {
    cascade: [Cascade.ALL],
    eager: true,
    orphanRemoval: true,
    strategy: LoadStrategy.SELECT_IN,
  })
  documents = new Collection<InvoiceDocumentEntity>(this);

  @OneToMany(() => ReserveInvoiceEntity, (reserve) => reserve.invoice, {
    cascade: [Cascade.ALL],
    lazy: true,
    orphanRemoval: true,
    strategy: LoadStrategy.SELECT_IN,
  })
  reserves = new Collection<ReserveInvoiceEntity>(this);

  @OneToMany(() => InvoiceTagEntity, (invoiceTag) => invoiceTag.invoice, {
    cascade: [Cascade.ALL],
    eager: true,
    orphanRemoval: true,
    strategy: LoadStrategy.SELECT_IN,
  })
  tags = new Collection<InvoiceTagEntity>(this);

  @OneToMany(() => ActivityLogEntity, (activity) => activity.invoice, {
    cascade: [Cascade.ALL],
    eager: true,
    orphanRemoval: true,
    strategy: LoadStrategy.SELECT_IN,
  })
  activities = new Collection<ActivityLogEntity>(this);

  @OneToMany(() => BrokerPaymentEntity, (payment) => payment.invoice, {
    cascade: [Cascade.ALL],
    lazy: true,
    strategy: LoadStrategy.SELECT_IN,
  })
  brokerPayments = new Collection<BrokerPaymentEntity>(this);

  @OneToMany(() => InvoiceClientPaymentEntity, (icp) => icp.invoice, {
    cascade: [Cascade.ALL],
    lazy: true,
    strategy: LoadStrategy.JOINED,
  })
  invoiceClientPayments = new Collection<InvoiceClientPaymentEntity>(this);

  @Formula(
    (alias) => `
  COALESCE(
    CASE
    WHEN ${alias}.purchased_date IS NOT NULL
      THEN (CURRENT_DATE - ${alias}.purchased_date::date)
      ELSE NULL
    END,
    0
  )
`,
  )
  daysSincePurchase!: number;

  @Formula(
    (alias) =>
      generateTotalFormulaByInvoiceStatus(
        alias,
        'client_id',
        InvoiceStatus.UnderReview,
      ),
    { lazy: true },
  )
  clientUnderReviewTotal?: number;

  @Formula(
    (alias) =>
      generateTotalFormulaByInvoiceStatus(
        alias,
        'client_id',
        InvoiceStatus.Purchased,
      ),
    {
      lazy: true,
    },
  )
  clientPurchasedTotal?: number;

  @Formula(
    (alias) =>
      generateTotalFormulaByInvoiceStatus(
        alias,
        'broker_id',
        InvoiceStatus.UnderReview,
      ),
    { lazy: true },
  )
  brokerUnderReviewTotal?: number;

  @Formula(
    (alias) =>
      generateTotalFormulaByInvoiceStatus(
        alias,
        'broker_id',
        InvoiceStatus.Purchased,
      ),
    { lazy: true },
  )
  brokerPurchasedTotal?: number;

  @Formula(
    (alias) =>
      generateTotalFormulaByBrokerPaymentStatus(
        alias,
        'broker_id',
        BrokerPaymentStatus.NotReceived,
      ),
    { lazy: true },
  )
  brokerNotReceivedTotal?: number;

  @Formula(
    (alias) =>
      generateTotalFormulaByBrokerPaymentStatus(
        alias,
        'broker_id',
        BrokerPaymentStatus.ShortPaid,
      ),
    { lazy: true },
  )
  brokerShortpaidTotal?: number;

  @Formula(
    (alias) =>
      generateTotalFormulaByBrokerPaymentStatus(
        alias,
        'broker_id',
        BrokerPaymentStatus.NonPayment,
      ),
    { lazy: true },
  )
  brokerNonPaymentTotal?: number;

  @Formula(
    (alias) =>
      `(SELECT CASE WHEN (SELECT COUNT(DISTINCT td.id)
    FROM invoice_tag_assoc ita
    INNER JOIN tag_definitions td ON ita.tag_definition_id  = td.id
    INNER JOIN tag_group_assoc tga ON td.id = tga.tag_id
    INNER JOIN tag_definition_group tdg ON tga.group_id  = tdg.id
    WHERE tdg.key = '${TagDefinitionGroupKey.INVOICE_ISSUES}'
    AND ita.invoice_id = ${alias}.id
    AND ita.record_status = '${RecordStatus.Active}'
    AND td.record_status = '${RecordStatus.Active}'
    AND tga.record_status = '${RecordStatus.Active}'
    AND tdg.record_status = '${RecordStatus.Active}'
    GROUP BY ita.invoice_id limit 1) > 0 THEN TRUE ELSE FALSE END)
`,
    { lazy: true },
  )
  hasIssues?: boolean;

  @Formula(
    (alias) =>
      `(SELECT CASE WHEN (SELECT COUNT(DISTINCT td.id)
    FROM invoice_tag_assoc ita
    INNER JOIN tag_definitions td ON ita.tag_definition_id  = td.id
    INNER JOIN tag_group_assoc tga ON td.id = tga.tag_id
    INNER JOIN tag_definition_group tdg ON tga.group_id  = tdg.id
    WHERE tdg.key IN
    (
    '${TagDefinitionGroupKey.INVOICE_ISSUES}',
    '${TagDefinitionGroupKey.PROCESSING_ACTION_ITEMS}',
    '${TagDefinitionGroupKey.ISSUES_SENDING_INVOICE_TO_BROKER}',
    '${TagDefinitionGroupKey.CLIENT_PAYMENT_ISSUES}',
    '${TagDefinitionGroupKey.BROKER_PAYMENT_ISSUES}',
    '${TagDefinitionGroupKey.REJECTION_REASONS}',
    '${TagDefinitionGroupKey.NON_PAYMENT_REASONS}'
    )
    AND ita.invoice_id = ${alias}.id
    AND ita.record_status = '${RecordStatus.Active}'
    AND td.record_status = '${RecordStatus.Active}'
    AND tga.record_status = '${RecordStatus.Active}'
    AND tdg.record_status = '${RecordStatus.Active}'
    GROUP BY ita.invoice_id limit 1) > 0 THEN TRUE ELSE FALSE END)
`,
    { lazy: true },
  )
  isDirty?: boolean;
}

const generateTotalFormulaByInvoiceStatus = (
  alias: string,
  convergenceField: string,
  status: InvoiceStatus,
) => {
  return (
    `(select sum(i.value) from invoices i where i.${convergenceField} = ${alias}.${convergenceField}` +
    ` AND i.status = '${status}'` +
    ` AND i.record_status = '${RecordStatus.Active}')`
  );
};

const generateTotalFormulaByBrokerPaymentStatus = (
  alias: string,
  convergenceField: string,
  brokerPaymentStatus: BrokerPaymentStatus,
) => {
  return (
    `(select sum(i.value) from invoices i where i.${convergenceField} = ${alias}.${convergenceField}` +
    ` AND i.broker_payment_status = '${brokerPaymentStatus}'` +
    ` AND i.record_status = '${RecordStatus.Active}')`
  );
};
