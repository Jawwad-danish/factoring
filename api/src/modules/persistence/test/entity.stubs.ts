import { UUID } from '@core/uuid';
import { Collection, Loaded } from '@mikro-orm/core';
import Big from 'big.js';
import { randomInt } from 'crypto';
import {
  ActivityLogEntity,
  AssignmentsChangelogAssocEntity,
  BrokerFactoringConfigEntity,
  BrokerFactoringStatsEntity,
  BrokerLimitAssocEntity,
  BrokerPaymentEntity,
  BrokerPaymentStatus,
  BrokerPaymentType,
  ClientBatchPaymentEntity,
  ClientBatchPaymentStatus,
  ClientBrokerAssignmentAssocEntity,
  ClientBrokerAssignmentEntity,
  ClientBrokerAssignmentStatus,
  ClientFactoringAnalyticsEntity,
  ClientFactoringConfigsEntity,
  ClientFactoringRateReason,
  ClientFactoringRateReasonAssocEntity,
  ClientFactoringRateReasonEntity,
  ClientFactoringStatus,
  ClientLimitAssocEntity,
  ClientPaymentEntity,
  ClientPaymentOperationType,
  ClientPaymentPlanAssocEntity,
  ClientPaymentStatus,
  ClientPaymentType,
  ClientReserveRateReason,
  ClientReserveRateReasonAssocEntity,
  ClientReserveRateReasonEntity,
  ClientStatusReason,
  ClientStatusReasonAssocEntity,
  ClientStatusReasonConfigEntity,
  ClientSuccessTeamEntity,
  ClientTagEntity,
  EmployeeEntity,
  EmployeeRole,
  FactoringCompanyEntity,
  FirebaseTokenEntity,
  InvoiceClientPaymentEntity,
  InvoiceDocumentEntity,
  InvoiceDocumentLabel,
  InvoiceDocumentType,
  InvoiceEntity,
  InvoiceStatus,
  InvoiceTagEntity,
  MaintenanceEntity,
  NotificationEntity,
  NotificationMedium,
  PaymentStatus,
  PaymentType,
  PendingBuyoutEntity,
  PendingBuyoutsBatchEntity,
  PeruseJobEntity,
  PeruseJobType,
  PeruseStatus,
  ProcessingNotesEntity,
  QBAccountKeys,
  QuickbooksAccountEntity,
  QuickbooksJournalEntryEntity,
  QuickbooksJournalEntryLineEntity,
  QuickbooksJournalEntryStatus,
  QuickbooksJournalEntryType,
  QuickbooksJournalPostingType,
  RecordStatus,
  ReserveBrokerPaymentEntity,
  ReserveClientPaymentEntity,
  ReserveEntity,
  ReserveInvoiceEntity,
  ReserveReason,
  TagDefinitionEntity,
  TagDefinitionKey,
  TagDefinitionLevel,
  TagDefinitionVisibility,
  TagStatus,
  UsedByType,
  UserEntity,
} from '../entities';
import { randomEmail, randomString } from './random';

export type PartialClientFactoringConfigsEntity = Partial<
  Omit<
    ClientFactoringConfigsEntity,
    | 'factoringRateHistory'
    | 'reserveRateHistory'
    | 'paymentPlanHistory'
    | 'statusHistory'
    | 'clientLimitHistory'
  >
> & {
  factoringRateHistory?: ClientFactoringRateReasonAssocEntity[];
  reserveRateHistory?: ClientReserveRateReasonAssocEntity[];
  paymentPlanHistory?: ClientPaymentPlanAssocEntity[];
  statusHistory?: ClientStatusReasonAssocEntity[];
  clientLimitHistory?: ClientLimitAssocEntity[];
};

export type PartialBrokerFactoringConfigsEntity = Partial<
  Omit<BrokerFactoringConfigEntity, 'limitHistory'>
> & {
  limitHistory?: BrokerLimitAssocEntity[];
};

export type PartialClientBrokerAssignmentEntity = Partial<
  Omit<ClientBrokerAssignmentEntity, 'assignmentHistory'>
> & {
  assignmentHistory?: ClientBrokerAssignmentAssocEntity[];
};

export class EntityStubs {
  static buildUser(data?: Partial<UserEntity>): UserEntity {
    const user = new UserEntity();
    user.id = UUID.get();
    user.email = randomEmail();
    user.firstName = randomString(7);
    user.lastName = randomString(7);
    user.externalId = UUID.get();
    user.recordStatus = RecordStatus.Active;
    user.createdAt = new Date();
    user.updatedAt = new Date();
    Object.assign(user, data);
    return user;
  }

  static buildClientSuccessTeam(
    data?: Partial<ClientSuccessTeamEntity>,
  ): ClientSuccessTeamEntity {
    const userEntity = this.buildUser();
    const team = new ClientSuccessTeamEntity();
    team.id = UUID.get();
    team.name = randomString(7);
    team.updatedBy = userEntity;
    team.createdBy = userEntity;
    Object.assign(team, data);
    return team;
  }

  static buildClientFactoringConfig(
    data?: PartialClientFactoringConfigsEntity,
  ): ClientFactoringConfigsEntity {
    const auditBy = this.buildUser();
    const config = new ClientFactoringConfigsEntity();
    config.id = UUID.get();
    config.clientId = UUID.get();
    config.status = ClientFactoringStatus.Active;
    config.verificationPercentage = new Big(0.0);
    config.factoringRatePercentage = new Big(0.4);
    config.updatedBy = auditBy;
    config.createdBy = auditBy;
    config.user = this.buildUser();
    config.clientSuccessTeam = this.buildClientSuccessTeam();
    config.expediteTransferOnly = false;
    config.doneSubmittingInvoices = true;
    config.acceptedFeeIncrease = true;
    config.reserveRatePercentage = new Big(0);
    if (data?.factoringRateHistory) {
      config.factoringRateHistory.hydrate(data.factoringRateHistory);
      delete data.factoringRateHistory;
    }
    if (data?.reserveRateHistory) {
      config.reserveRateHistory.hydrate(data.reserveRateHistory);
      delete data.reserveRateHistory;
    }
    if (data?.paymentPlanHistory) {
      config.paymentPlanHistory.hydrate(data.paymentPlanHistory);
      delete data.paymentPlanHistory;
    }
    if (data?.statusHistory) {
      config.statusHistory.hydrate(data.statusHistory);
      delete data.statusHistory;
    }
    if (data?.clientLimitHistory) {
      config.clientLimitHistory.hydrate(data.clientLimitHistory);
      delete data.clientLimitHistory;
    }
    Object.assign(config, data);
    return config;
  }

  static buildEmployee(data?: Partial<EmployeeEntity>) {
    const user = this.buildUser();
    const entity = new EmployeeEntity();
    entity.id = UUID.get();
    entity.role = EmployeeRole.Underwriter;
    entity.extension = '123';
    entity.user = user;
    Object.assign(entity, data);
    return entity;
  }

  static buildStubFactoringCompany(
    data?: Partial<FactoringCompanyEntity>,
  ): FactoringCompanyEntity {
    const userEntity = this.buildUser();
    const entity = new FactoringCompanyEntity();
    entity.name = 'random-company';
    entity.id = UUID.get();
    entity.recordStatus = RecordStatus.Active;
    entity.createdAt = new Date();
    entity.updatedAt = new Date();
    entity.createdBy = userEntity;
    entity.updatedBy = userEntity;
    Object.assign(entity, data);
    return entity;
  }

  static buildStubTagDefinition(
    data?: Partial<TagDefinitionEntity>,
  ): TagDefinitionEntity {
    const entity = new TagDefinitionEntity();
    entity.id = UUID.get();
    entity.key = TagDefinitionKey.MISSING_RECEIVER_SIGNATURE;
    entity.name = 'Missing signature';
    entity.level = TagDefinitionLevel.Error;
    entity.usedBy = [UsedByType.User];
    entity.visibility = TagDefinitionVisibility.All;
    entity.createdAt = new Date();
    entity.updatedAt = new Date();
    const user = this.buildUser();
    entity.createdBy = user;
    entity.updatedBy = user;
    Object.assign(entity, data);
    return entity;
  }

  static buildStubActivityLog(): ActivityLogEntity {
    const entity = new ActivityLogEntity();
    entity.id = UUID.get();
    entity.note = 'note';
    entity.tagDefinition = this.buildStubTagDefinition();
    entity.payload = { body: true };
    entity.createdAt = new Date();
    entity.createdBy = this.buildUser();
    return entity;
  }

  static buildStubClientTag(key?: TagDefinitionKey): ClientTagEntity {
    const userEntity = this.buildUser();
    const entity = new ClientTagEntity();
    entity.id = UUID.get();
    entity.clientId = UUID.get();
    entity.tagDefinition = this.buildStubTagDefinition({ key });
    entity.createdAt = new Date();
    entity.createdBy = userEntity;
    return entity;
  }

  static buildStubReserve(data?: Partial<ReserveEntity>): ReserveEntity {
    const entity = new ReserveEntity();
    entity.id = UUID.get();
    entity.clientId = UUID.get();
    entity.amount = new Big(-200);
    entity.note = 'Note';
    entity.payload = {
      __type: 'releaseOfFunds',
    };
    entity.reason = ReserveReason.ReleaseToThirdParty;
    entity.createdAt = new Date();
    entity.createdBy = this.buildUser();
    Object.assign(entity, data);
    return entity;
  }

  static buildStubLoadedReserve(
    data?: Partial<ReserveEntity>,
  ): Loaded<ReserveEntity, string> {
    return this.buildStubReserve(data) as Loaded<ReserveEntity, string>;
  }

  static buildStubReserveClientPayment(
    data?: Partial<ReserveClientPaymentEntity>,
  ): ReserveClientPaymentEntity {
    const entity = new ReserveClientPaymentEntity();
    entity.id = UUID.get();
    entity.clientPayment = this.buildStubClientPayment();
    entity.reserve = this.buildStubReserve();
    entity.createdAt = new Date();
    entity.updatedAt = new Date();
    const user = this.buildUser();
    entity.createdBy = user;
    entity.updatedBy = user;
    Object.assign(entity, data);
    return entity;
  }

  static buildStubClientPayment(
    data?: Partial<ClientPaymentEntity>,
  ): ClientPaymentEntity {
    const userEntity = this.buildUser();
    const entity = new ClientPaymentEntity();
    entity.id = UUID.get();
    entity.bankAccountLastDigits = '1324';
    entity.type = ClientPaymentType.Invoice;
    entity.status = PaymentStatus.PENDING;
    entity.amount = Big(randomInt(1000));
    entity.clientBankAccountId = UUID.get();
    entity.operationType = ClientPaymentOperationType.Credit;
    entity.batchPayment = this.buildStubClientBatchPayment();
    entity.recordStatus = RecordStatus.Active;
    entity.type = ClientPaymentType.Invoice;
    entity.transferFee = Big(randomInt(1000));
    entity.createdAt = new Date();
    entity.createdBy = userEntity;
    entity.updatedAt = new Date();
    entity.updatedBy = userEntity;
    entity.invoicePayments = new Collection<InvoiceClientPaymentEntity>(entity);
    entity.reservePayments = new Collection<ReserveClientPaymentEntity>(entity);
    Object.assign(entity, data);
    return entity;
  }

  static buildStubClientBatchPayment(
    data?: Partial<ClientBatchPaymentEntity>,
  ): ClientBatchPaymentEntity {
    const userEntity = this.buildUser();
    const entity = new ClientBatchPaymentEntity();
    entity.id = UUID.get();
    entity.name = UUID.get();
    entity.type = PaymentType.ACH;
    entity.status = ClientBatchPaymentStatus.Pending;
    entity.createdAt = new Date();
    entity.createdBy = userEntity;
    entity.updatedAt = new Date();
    entity.updatedBy = userEntity;
    Object.assign(entity, data);
    return entity;
  }

  static createStubReserveBrokerPayment(
    data?: Partial<ReserveBrokerPaymentEntity>,
  ): ReserveBrokerPaymentEntity {
    const entity = new ReserveBrokerPaymentEntity();
    entity.id = UUID.get();
    entity.reserve = this.buildStubReserve();
    entity.brokerPayment = this.buildStubBrokerPayment();
    Object.assign(entity, data);
    return entity;
  }

  static createStubReserveInvoice(
    data?: Partial<ReserveInvoiceEntity>,
  ): ReserveInvoiceEntity {
    const entity = new ReserveInvoiceEntity();
    entity.id = UUID.get();
    entity.reserve = this.buildStubReserve();
    entity.invoice = this.createStubInvoice();
    Object.assign(entity, data);
    return entity;
  }

  static buildStubBrokerPayment(
    data?: Partial<BrokerPaymentEntity>,
  ): BrokerPaymentEntity {
    const entity = new BrokerPaymentEntity();
    entity.id = UUID.get();
    Object.assign(entity, {
      invoice: UUID.get(),
    });
    entity.amount = new Big(200);
    entity.type = BrokerPaymentType.Ach;
    entity.createdAt = new Date();
    entity.updatedAt = new Date();
    entity.createdBy = this.buildUser();
    entity.updatedBy = this.buildUser();
    entity.recordStatus = RecordStatus.Active;
    Object.assign(entity, data);
    return entity;
  }

  static createStubReserve(data?: Partial<ReserveEntity>): ReserveEntity {
    const entity = new ReserveEntity();
    entity.id = UUID.get();
    entity.amount = new Big(200);
    entity.reason = ReserveReason.Overpay;
    entity.createdAt = new Date();
    entity.createdBy = this.buildUser();
    Object.assign(entity, data);
    return entity;
  }

  static createClientBrokerAssignment(
    data?: Partial<ClientBrokerAssignmentEntity>,
  ): ClientBrokerAssignmentEntity {
    const entity = new ClientBrokerAssignmentEntity();
    entity.id = UUID.get();
    entity.clientId = UUID.get();
    entity.brokerId = UUID.get();
    entity.status = ClientBrokerAssignmentStatus.Sent;
    Object.assign(entity, data);
    return entity;
  }

  static createStubInvoice(data?: Partial<InvoiceEntity>): InvoiceEntity {
    const entity = new InvoiceEntity();
    entity.id = UUID.get();
    entity.clientId = UUID.get();
    entity.brokerId = UUID.get();
    entity.displayId = 'display';
    entity.tags = new Collection<InvoiceTagEntity>(entity);
    entity.documents = new Collection<InvoiceDocumentEntity>(entity);
    entity.loadNumber = 'load';
    entity.note = 'note';
    entity.memo = 'memo';
    entity.lineHaulRate = new Big(10);
    entity.detention = new Big(10);
    entity.lumper = new Big(10);
    entity.advance = new Big(10);
    entity.value = new Big(10);
    entity.deduction = new Big(10);
    entity.approvedFactorFee = new Big(1);
    entity.expedited = false;
    entity.clientPaymentStatus = ClientPaymentStatus.NotApplicable;
    entity.brokerPaymentStatus = BrokerPaymentStatus.NotReceived;
    entity.status = InvoiceStatus.UnderReview;
    entity.createdAt = new Date();
    entity.updatedAt = new Date();
    entity.createdBy = this.buildUser();
    entity.updatedBy = this.buildUser();
    Object.assign(entity, data);
    return entity;
  }

  static buildStubInvoiceClientPayment(
    data?: Partial<InvoiceClientPaymentEntity>,
  ): InvoiceClientPaymentEntity {
    const userEntity = this.buildUser();
    const entity = new InvoiceClientPaymentEntity();
    entity.id = UUID.get();
    entity.clientPayment = this.buildStubClientPayment();
    entity.invoice = this.createStubInvoice();
    entity.createdAt = new Date();
    entity.createdBy = userEntity;
    entity.updatedAt = new Date();
    entity.updatedBy = userEntity;
    Object.assign(entity, data);
    return entity;
  }

  static buildStubMonetaryInvoice(
    data?: Partial<Pick<InvoiceEntity, 'loadNumber' | 'id'>>,
  ): InvoiceEntity {
    const entity = new InvoiceEntity();
    entity.id = UUID.get();
    entity.loadNumber = 'random_cargo';

    Object.assign(entity, data);
    return entity;
  }

  static buildStubActivity(tag: TagDefinitionEntity): ActivityLogEntity {
    const entity = new ActivityLogEntity();
    entity.id = UUID.get();
    entity.tagDefinition = tag;
    entity.recordStatus = RecordStatus.Active;
    entity.tagStatus = TagStatus.Active;
    entity.createdAt = new Date();
    entity.createdBy = this.buildUser();
    return entity;
  }

  static buildStubInvoiceTag(tag: TagDefinitionEntity): InvoiceTagEntity {
    const entity = new InvoiceTagEntity();
    entity.id = UUID.get();
    entity.tagDefinition = tag;
    entity.createdAt = new Date();
    entity.createdBy = this.buildUser();
    entity.recordStatus = RecordStatus.Active;
    return entity;
  }

  static buildStubReserveInvoice(
    invoice?: InvoiceEntity,
    reserve?: ReserveEntity,
  ): ReserveInvoiceEntity {
    const entity = new ReserveInvoiceEntity();
    entity.id = UUID.get();
    entity.invoice = invoice || this.buildStubInvoice();
    entity.reserve = reserve || this.buildStubReserve();
    entity.createdBy = this.buildUser();
    return entity;
  }

  static buildStubInvoice(
    data?: Partial<
      Omit<
        InvoiceEntity,
        'documents' | 'tags' | 'activities' | 'brokerPayments'
      >
    > & {
      documents?: InvoiceDocumentEntity[];
      tags?: InvoiceTagEntity[];
      activities?: ActivityLogEntity[];
      brokerPayments?: BrokerPaymentEntity[];
    },
  ): InvoiceEntity {
    const entity = new InvoiceEntity();
    entity.id = UUID.get();
    entity.clientId = UUID.get();
    entity.brokerId = UUID.get();
    entity.displayId = 'display';
    entity.activities = new Collection<ActivityLogEntity>(entity);
    entity.tags = new Collection<InvoiceTagEntity>(entity);
    entity.documents = new Collection<InvoiceDocumentEntity>(entity);
    entity.loadNumber = 'random_cargo';
    entity.note = 'note';
    entity.memo = 'memo';
    entity.lineHaulRate = new Big(10);
    entity.detention = new Big(10);
    entity.lumper = new Big(10);
    entity.advance = new Big(10);
    entity.value = new Big(10);
    entity.deduction = new Big(10);
    entity.accountsReceivableValue = new Big(0);
    entity.approvedFactorFee = new Big(0);
    entity.approvedFactorFeePercentage = new Big(0);
    entity.expedited = data?.expedited ?? true;
    entity.clientPaymentStatus = ClientPaymentStatus.NotApplicable;
    entity.brokerPaymentStatus = BrokerPaymentStatus.NotReceived;
    entity.status = InvoiceStatus.UnderReview;
    entity.createdAt = new Date();
    entity.updatedAt = new Date();
    entity.createdBy = this.buildUser();
    entity.updatedBy = this.buildUser();
    if (data?.activities) {
      entity.activities.hydrate(data.activities);
      delete data.activities;
    }
    if (data?.tags) {
      entity.tags.hydrate(data.tags);
      delete data.tags;
    }
    if (data?.documents) {
      entity.documents.hydrate(data.documents);
      delete data.documents;
    }
    if (data?.brokerPayments) {
      entity.brokerPayments.hydrate(data.brokerPayments);
      delete data.brokerPayments;
    }
    Object.assign(entity, data);
    return entity;
  }

  static buildBrokerFactoringConfigStub(
    data?: PartialBrokerFactoringConfigsEntity,
  ): BrokerFactoringConfigEntity {
    const userEntity = this.buildUser();
    const entity = new BrokerFactoringConfigEntity();
    entity.id = UUID.get();
    entity.brokerId = UUID.get();
    entity.limitAmount = new Big(1000);
    entity.updatedBy = userEntity;
    entity.createdBy = userEntity;
    if (data?.limitHistory) {
      entity.limitHistory.hydrate(data.limitHistory);
      delete data.limitHistory;
    }
    Object.assign(entity, data);
    return entity;
  }

  static buildStubBrokerFactoringStats(
    data: Partial<BrokerFactoringStatsEntity>,
  ): BrokerFactoringStatsEntity {
    const entity = new BrokerFactoringStatsEntity();
    entity.brokerId = 'broker_id';
    Object.assign(entity, data);
    return entity;
  }

  static buildClientBatchPayment(
    data?: Partial<ClientBatchPaymentEntity>,
  ): ClientBatchPaymentEntity {
    const userEntity = this.buildUser();
    const entity = new ClientBatchPaymentEntity();
    entity.id = UUID.get();
    entity.name = UUID.get();
    entity.type = PaymentType.ACH;
    entity.status = ClientBatchPaymentStatus.Pending;
    entity.createdAt = new Date();
    entity.createdBy = userEntity;
    entity.updatedAt = new Date();
    entity.updatedBy = userEntity;
    Object.assign(entity, data);
    return entity;
  }

  static buildClientBrokerAssignment(
    data?: Partial<PartialClientBrokerAssignmentEntity>,
  ): ClientBrokerAssignmentEntity {
    const userEntity = this.buildUser();
    const entity = new ClientBrokerAssignmentEntity();
    entity.id = UUID.get();
    entity.createdAt = new Date();
    entity.updatedAt = new Date();
    entity.createdBy = userEntity;
    entity.updatedBy = userEntity;
    entity.clientId = UUID.get();
    entity.brokerId = UUID.get();
    entity.status = ClientBrokerAssignmentStatus.Verified;
    Object.assign(entity, data);

    if (data?.assignmentHistory) {
      entity.assignmentHistory.hydrate(data.assignmentHistory);
      delete data.assignmentHistory;
    }
    return entity;
  }

  static buildClientBrokerAssignmentAssocStub(
    data?: Partial<ClientBrokerAssignmentAssocEntity>,
  ): ClientBrokerAssignmentAssocEntity {
    const entity = new ClientBrokerAssignmentAssocEntity();
    entity.id = UUID.get();
    entity.createdAt = new Date();
    entity.updatedAt = new Date();
    entity.createdBy = this.buildUser();
    entity.updatedBy = this.buildUser();
    entity.status = ClientBrokerAssignmentStatus.Verified;
    Object.assign(entity, data);
    return entity;
  }

  static buildAssignmentsChangelogAssocStub(
    data?: Partial<AssignmentsChangelogAssocEntity>,
  ): AssignmentsChangelogAssocEntity {
    const entity = new AssignmentsChangelogAssocEntity();
    entity.id = UUID.get();
    entity.createdAt = new Date();
    entity.updatedAt = new Date();
    entity.createdBy = this.buildUser();
    entity.updatedBy = this.buildUser();
    entity.changelogNotes = 'Invoice emailed now';
    Object.assign(entity, data);
    return entity;
  }

  static buildClientBrokerAssignmentStub(
    data?: Partial<ClientBrokerAssignmentEntity>,
  ): ClientBrokerAssignmentEntity {
    const entity = new ClientBrokerAssignmentEntity();
    entity.id = UUID.get();
    entity.clientId = data?.clientId ? data.clientId : UUID.get();
    entity.brokerId = data?.brokerId ? data.brokerId : UUID.get();
    entity.status = data?.status
      ? data.status
      : ClientBrokerAssignmentStatus.Sent;
    Object.assign(entity, data);
    return entity;
  }

  static buildClientFactoringAnalytics(
    data: Partial<ClientFactoringAnalyticsEntity>,
  ): ClientFactoringAnalyticsEntity {
    const entity = new ClientFactoringAnalyticsEntity();
    entity.clientId = 'client_id';
    entity.firstPurchasedDate = new Date();
    entity.firstCreatedDate = new Date();
    Object.assign(entity, data);
    return entity;
  }

  static buildClientFactoringReasonAssocStub(
    data?: Partial<ClientFactoringRateReasonAssocEntity>,
  ): ClientFactoringRateReasonAssocEntity {
    const userEntity = this.buildUser();
    const entity = new ClientFactoringRateReasonAssocEntity();
    entity.id = UUID.get();
    entity.factoringRatePercentage = new Big(0.4);
    entity.createdBy = userEntity;
    entity.createdAt = new Date();
    entity.note = 'note';
    entity.reason = this.buildClientFactoringRateReasonStub();
    Object.assign(entity, data);
    return entity;
  }

  static buildClientFactoringRateReasonStub(
    data?: Partial<ClientFactoringRateReasonEntity>,
  ): ClientFactoringRateReasonEntity {
    const userEntity = this.buildUser();
    const entity = new ClientFactoringRateReasonEntity();
    entity.id = UUID.get();
    entity.reason = ClientFactoringRateReason.None;
    entity.createdAt = new Date();
    entity.createdBy = userEntity;
    entity.updatedAt = new Date();
    entity.updatedBy = userEntity;
    Object.assign(entity, data);
    return entity;
  }

  static buildClientReserveRateReasonStub(
    data?: Partial<ClientReserveRateReasonEntity>,
  ): ClientReserveRateReasonEntity {
    const userEntity = this.buildUser();
    const entity = new ClientReserveRateReasonEntity();
    entity.id = UUID.get();
    entity.reason = ClientReserveRateReason.Other;
    entity.createdAt = new Date();
    entity.createdBy = userEntity;
    entity.updatedAt = new Date();
    entity.updatedBy = userEntity;
    Object.assign(entity, data);
    return entity;
  }

  static buildClientReserveReasonAssocStub(
    data?: Partial<ClientReserveRateReasonAssocEntity>,
  ): ClientReserveRateReasonAssocEntity {
    const userEntity = this.buildUser();
    const entity = new ClientReserveRateReasonAssocEntity();
    entity.id = UUID.get();
    entity.reserveRatePercentage = new Big(0.4);
    entity.createdBy = userEntity;
    entity.createdAt = new Date();
    entity.note = 'note';
    entity.reserveRateReason = this.buildClientReserveRateReasonStub();
    Object.assign(entity, data);
    return entity;
  }

  static buildStubInvoiceDocument(
    data?: Partial<InvoiceDocumentEntity>,
  ): InvoiceDocumentEntity {
    const userEntity = this.buildUser();
    const entity = new InvoiceDocumentEntity();
    entity.id = UUID.get();
    entity.name = randomString(10);
    entity.internalUrl = `https://${randomString(10)}`;
    entity.externalUrl = `https://${randomString(10)}`;
    entity.fileHash = randomString(10);
    entity.type = InvoiceDocumentType.Uploaded;
    entity.label = InvoiceDocumentLabel.Bill_of_landing;
    entity.createdAt = new Date();
    entity.updatedAt = new Date();
    entity.createdBy = userEntity;
    entity.updatedBy = userEntity;
    Object.assign(entity, data);
    return entity;
  }

  static buildStubMaintenance(
    data?: Partial<MaintenanceEntity>,
  ): MaintenanceEntity {
    const entity = new MaintenanceEntity();
    entity.id = UUID.get();
    entity.isEnabled = true;
    entity.message = 'Maintenance message test';
    entity.createdAt = new Date();
    entity.createdBy = this.buildUser();
    Object.assign(entity, data);
    return entity;
  }

  static buildStubNotification(
    data?: Partial<NotificationEntity>,
  ): NotificationEntity {
    const entity = new NotificationEntity();
    entity.id = UUID.get();
    entity.clientId = UUID.get();
    entity.medium = NotificationMedium.EMAIL;
    entity.recipient = 'test@test.com';
    entity.subject = 'Subject';
    entity.message = 'Message';
    entity.createdAt = new Date();
    entity.createdBy = this.buildUser();
    Object.assign(entity, data);
    return entity;
  }

  static buildStubPendingBuyout(
    data?: Partial<PendingBuyoutEntity>,
  ): PendingBuyoutEntity {
    const userEntity = this.buildUser();
    const entity = new PendingBuyoutEntity();
    entity.id = UUID.get();
    entity.clientId = UUID.get();
    entity.paymentDate = new Date();
    entity.createdAt = new Date();
    entity.updatedAt = new Date();
    entity.createdBy = userEntity;
    entity.updatedBy = userEntity;
    Object.assign(entity, data);
    return entity;
  }

  static buildStubBuyoutsBatch(
    data?: Partial<PendingBuyoutsBatchEntity>,
  ): PendingBuyoutsBatchEntity {
    const userEntity = this.buildUser();
    const entity = new PendingBuyoutsBatchEntity();
    entity.factoringCompany = EntityStubs.buildStubFactoringCompany();
    entity.bobtailPayableFee = Big(1000);
    entity.clientPayableFee = Big(1000);
    entity.buyouts = new Collection<PendingBuyoutEntity>(entity);
    entity.recordStatus = RecordStatus.Active;
    entity.createdAt = new Date();
    entity.updatedAt = new Date();
    entity.createdBy = userEntity;
    entity.updatedBy = userEntity;
    Object.assign(entity, data);
    return entity;
  }

  static buildStubPeruseJob(data?: Partial<PeruseJobEntity>): PeruseJobEntity {
    const entity = new PeruseJobEntity();
    entity.id = UUID.get();
    entity.invoiceId = UUID.get();
    entity.jobId = UUID.get();
    entity.response = {};
    entity.request = {};
    entity.status = PeruseStatus.Done;
    entity.type = PeruseJobType.CreateLoad;
    entity.recordStatus = RecordStatus.Active;
    if (data) {
      Object.assign(entity, data);
    }
    return entity;
  }

  static buildStubProcessingNotes(
    data?: Partial<ProcessingNotesEntity>,
  ): ProcessingNotesEntity {
    const userEntity = this.buildUser();
    const entity = new ProcessingNotesEntity();

    entity.id = UUID.get();
    entity.notes = 'notes';
    entity.clientId = UUID.get();
    entity.brokerId = UUID.get();
    entity.createdAt = new Date();
    entity.createdBy = userEntity;
    entity.updatedAt = new Date();
    entity.updatedBy = userEntity;
    Object.assign(entity, data);
    return entity;
  }

  static buildStubUser(data?: Partial<UserEntity>): UserEntity {
    const entity = new UserEntity();
    entity.id = UUID.get();
    entity.firstName = 'test';
    entity.lastName = 'bobtail';
    entity.externalId = UUID.get();
    entity.recordStatus = RecordStatus.Active;
    entity.email = 'test@bobtail.com';
    entity.createdAt = new Date();
    entity.updatedAt = new Date();
    Object.assign(entity, data);
    return entity;
  }

  static buildClientStatusReasonAssocEntity(
    data?: Partial<ClientStatusReasonAssocEntity>,
  ): ClientStatusReasonAssocEntity {
    const entity = new ClientStatusReasonAssocEntity();
    entity.id = UUID.get();
    entity.note = 'note';
    entity.clientStatusReasonConfig =
      this.buildClientStatusReasonConfigEntity();
    entity.createdAt = new Date();
    entity.createdBy = this.buildUser();
    Object.assign(entity, data);
    return entity;
  }

  static buildClientStatusReasonConfigEntity(
    data?: Partial<ClientStatusReasonConfigEntity>,
  ): ClientStatusReasonConfigEntity {
    const entity = new ClientStatusReasonConfigEntity();
    entity.id = UUID.get();
    entity.reason = ClientStatusReason.Other;
    entity.status = ClientFactoringStatus.Active;
    entity.createdAt = new Date();
    entity.createdBy = this.buildUser();
    Object.assign(entity, data);
    return entity;
  }

  static buildStubFirebaseToken(
    data?: Partial<FirebaseTokenEntity>,
  ): FirebaseTokenEntity {
    const entity = new FirebaseTokenEntity();
    entity.user = data?.user || this.buildStubUser();
    entity.token = data?.token || randomString(20);
    entity.recordStatus = data?.recordStatus || RecordStatus.Active;
    entity.createdBy = data?.user || entity.user;
    entity.createdAt = data?.createdAt || new Date();
    entity.updatedBy = data?.user || entity.user;
    entity.updatedAt = data?.updatedAt || new Date();
    Object.assign(entity, data);
    return entity;
  }

  static buildStubQuickbooksAccount(
    data?: Partial<QuickbooksAccountEntity>,
  ): QuickbooksAccountEntity {
    const entity = new QuickbooksAccountEntity();
    entity.id = UUID.get();
    entity.recordStatus = RecordStatus.Active;
    entity.createdAt = new Date();
    entity.createdBy = this.buildUser();
    entity.name = 'name';
    entity.quickbooksId = '123';
    entity.type = 'type';
    entity.subType = 'subType';
    entity.key = QBAccountKeys.FactoringAR;
    entity.number = '123';
    Object.assign(entity, data);
    return entity;
  }

  static buildStubJournalEntry(
    data?: Partial<QuickbooksJournalEntryEntity>,
  ): QuickbooksJournalEntryEntity {
    const entity = new QuickbooksJournalEntryEntity();
    entity.id = UUID.get();
    entity.recordStatus = RecordStatus.Active;
    entity.createdAt = new Date();
    entity.createdBy = this.buildUser();
    entity.docName = 'CP-20251008';
    entity.type = QuickbooksJournalEntryType.BatchPayment;
    entity.businessDay = '2025-10-08';
    entity.status = QuickbooksJournalEntryStatus.Pending;
    entity.lines = new Collection<QuickbooksJournalEntryLineEntity>(entity);
    Object.assign(entity, data);
    return entity;
  }

  static buildStubJournalEntryLine(
    data?: Partial<QuickbooksJournalEntryLineEntity>,
  ): QuickbooksJournalEntryLineEntity {
    const entity = new QuickbooksJournalEntryLineEntity();
    entity.id = UUID.get();
    entity.recordStatus = RecordStatus.Active;
    entity.createdAt = new Date();
    entity.createdBy = this.buildUser();
    entity.amount = Big(100);
    entity.account = this.buildStubQuickbooksAccount();
    entity.type = QuickbooksJournalPostingType.Debit;
    Object.assign(entity, data);
    return entity;
  }
}
