import { Entity, Enum, Property } from '@mikro-orm/core';
import Big from 'big.js';
import { BasicEntity } from './basic.entity';
import { BrokerPaymentType } from './broker-payment.entity';

export enum AuditLogType {
  BrokerPayment = 'broker_payment',
  Quickbooks = 'quickbooks',
}

export interface BrokerPaymentAuditLogPayload {
  operation: 'create' | 'edit' | 'delete';
  invoiceId: string;
  invoiceNumber: string;
  invoiceCreationDate: Date;
  brokerPaymentId: string;
  brokerPaymentAmount: Big;
  brokerPaymentCreationDate: Date;
  brokerPaymentBatchDate: Date;
  brokerPaymentCheckNumber: string;
  brokerPaymentType: BrokerPaymentType;
}

@Entity({ tableName: 'audit_log' })
export class AuditLogEntity extends BasicEntity {
  @Enum({
    items: () => AuditLogType,
    nullable: false,
  })
  type: AuditLogType;

  @Property({ type: 'text[]', nullable: false, unique: false })
  notes: string[];

  @Property({ type: 'json', nullable: false, unique: false })
  payload: BrokerPaymentAuditLogPayload | object;
}
