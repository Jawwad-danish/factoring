import { Entity, Enum, Property } from '@mikro-orm/core';
import { BasicMutableEntity } from './basic-mutable.entity';
import { ClientFactoringStatus } from './factoring-config.common';

export enum ClientStatusReason {
  Fraud = 'fraud',
  FMCSAIssues = 'fmcsa_issues',
  BuyoutInProgress = 'buyout_in_progress',
  Other = 'other',
  SwitchedFactoringCompany = 'switched_factoring_company',
  InsuranceIssues = 'insurance_issues',
  NoLongerFactoring = 'no_longer_factoring',
  ReadyToFactor = 'ready_to_factor',
  SubmittingInvoices = 'submitting_invoices',
  InvoiceIssues = 'invoice_issues',
  AdditionalInformationRequired = 'additional_information_required',
  ClientLimitExceeded = 'client_limit_exceeded',
  PreviousWriteOff = 'previous_write_off',
  Inactivity = 'inactivity',
}

@Entity({ tableName: 'client_status_reason_configs' })
export class ClientStatusReasonConfigEntity extends BasicMutableEntity {
  @Enum({
    items: () => ClientFactoringStatus,
    nullable: false,
    default: ClientFactoringStatus.Hold,
  })
  status: ClientFactoringStatus = ClientFactoringStatus.Hold;

  @Enum({
    items: () => ClientStatusReason,
    nullable: false,
    default: ClientStatusReason.Other,
  })
  reason: ClientStatusReason = ClientStatusReason.Other;

  @Property({ type: 'boolean', default: false })
  notifyClient = false;

  @Property({ type: 'boolean', default: false })
  displayMessage = false;
}
