import {
  BasicEntity,
  BrokerPaymentEntity,
  ClientFactoringConfigsEntity,
  InvoiceEntity,
  UserEntity,
} from '../entities';
import { BrokerPaymentHistoryEntity } from './broker-payment-history.entity';
import { ClientFactoringConfigsHistoryEntity } from './client-factoring-config-history.entity';
import { HistoryEntity } from './history.entity';
import { InvoiceHistoryEntity } from './invoice-history.entity';
import { UserHistoryEntity } from './user-history.entity';

export class HistoryFactory {
  static isHistoryEntity(entityName: any): boolean {
    return [
      InvoiceHistoryEntity.name,
      UserHistoryEntity.name,
      ClientFactoringConfigsHistoryEntity.name,
      BrokerPaymentHistoryEntity.name,
    ].includes(entityName);
  }

  static fromEntity(entity: BasicEntity): null | HistoryEntity {
    if (entity instanceof InvoiceEntity) {
      return this.toInvoiceHistoryEntity(entity);
    }
    if (entity instanceof UserEntity) {
      return this.toUserHistoryEntity(entity);
    }
    if (entity instanceof ClientFactoringConfigsEntity) {
      return this.toClientFactoringConfigsHistoryEntity(entity);
    }
    if (entity instanceof BrokerPaymentEntity) {
      return this.toBrokerPaymentHistoryEntity(entity);
    }
    return null;
  }

  private static toInvoiceHistoryEntity(
    entity: InvoiceEntity,
  ): InvoiceHistoryEntity {
    const history = new InvoiceHistoryEntity();
    this.assignDefaults(entity, history);
    history.clientId = entity.clientId;
    history.brokerId = entity.brokerId;
    history.displayId = entity.displayId;
    history.buyoutId = entity.buyout?.id || null;
    history.loadNumber = entity.loadNumber;
    history.lineHaulRate = entity.lineHaulRate;
    history.lumper = entity.lumper;
    history.detention = entity.detention;
    history.advance = entity.advance;
    history.paymentDate = entity.paymentDate;
    history.expedited = entity.expedited;
    history.accountsReceivableValue = entity.accountsReceivableValue;
    history.value = entity.value;
    history.accountsReceivableValue = entity.accountsReceivableValue;
    history.approvedFactorFee = entity.approvedFactorFee;
    history.approvedFactorFeePercentage = entity.approvedFactorFeePercentage;
    history.reserveRatePercentage = entity.reserveRatePercentage;
    history.reserveFee = entity.reserveFee;
    history.deduction = entity.deduction;
    history.memo = entity.memo;
    history.note = entity.note;
    history.status = entity.status;
    history.rejectedDate = entity.rejectedDate;
    history.purchasedDate = entity.purchasedDate;
    history.brokerPaymentStatus = entity.brokerPaymentStatus;
    history.clientPaymentStatus = entity.clientPaymentStatus;
    history.verificationStatus = entity.verificationStatus;
    return history;
  }

  private static toUserHistoryEntity(entity: UserEntity): UserHistoryEntity {
    const history = new UserHistoryEntity();
    HistoryFactory.assignDefaults(entity, history);
    history.email = entity.email;
    history.firstName = entity.firstName;
    history.lastName = entity.lastName;
    history.externalId = entity.externalId;
    return history;
  }

  private static toClientFactoringConfigsHistoryEntity(
    entity: ClientFactoringConfigsEntity,
  ): ClientFactoringConfigsHistoryEntity {
    const history = new ClientFactoringConfigsHistoryEntity();
    HistoryFactory.assignDefaults(entity, history);
    history.clientId = entity.clientId;
    history.factoringRatePercentage = entity.factoringRatePercentage;
    history.reserveRatePercentage = entity.reserveRatePercentage;
    history.verificationPercentage = entity.verificationPercentage;
    history.vip = entity.vip;
    history.requiresVerification = entity.requiresVerification;
    history.expediteTransferOnly = entity.expediteTransferOnly;
    history.doneSubmittingInvoices = entity.doneSubmittingInvoices;
    history.clientSuccessTeamId = entity.clientSuccessTeam.id;
    history.userId = entity.userId;
    history.acceptedFeeIncrease = entity.acceptedFeeIncrease;
    history.ccInEmails = entity.ccInEmails;
    history.clientLimitAmount = entity.clientLimitAmount;
    history.status = entity.status;
    history.insuranceAgency = entity.insuranceAgency;
    history.insuranceCompany = entity.insuranceCompany;
    history.insuranceMonthlyPaymentPerTruck =
      entity.insuranceMonthlyPaymentPerTruck;
    history.insuranceRenewalDate = entity.insuranceRenewalDate;
    history.ofacVerified = entity.ofacVerified;
    history.carrier411Alerts = entity.carrier411Alerts;
    history.taxGuardAlerts = entity.taxGuardAlerts;
    history.dryvanTrucksAmount = entity.dryvanTrucksAmount;
    history.refrigeratedTrucksAmount = entity.refrigeratedTrucksAmount;
    history.flatbedTrucksAmount = entity.flatbedTrucksAmount;
    history.stepdeckTrucksAmount = entity.stepdeckTrucksAmount;
    history.leasedTrucksAmount = entity.leasedTrucksAmount;
    history.otherTrucksAmount = entity.otherTrucksAmount;
    return history;
  }

  private static toBrokerPaymentHistoryEntity(
    entity: BrokerPaymentEntity,
  ): BrokerPaymentHistoryEntity {
    const history = new BrokerPaymentHistoryEntity();
    HistoryFactory.assignDefaults(entity, history);
    history.invoiceId = entity.invoice.id;
    history.type = entity.type;
    history.amount = entity.amount;
    history.checkNumber = entity.checkNumber;
    history.batchDate = entity.batchDate;
    return history;
  }

  private static assignDefaults(
    entity: Pick<BasicEntity, 'id' | 'createdAt' | 'recordStatus'>,
    history: HistoryEntity,
  ) {
    history.entityId = entity.id;
    history.entityCreatedAt = entity.createdAt;
    history.entityRecordStatus = entity.recordStatus;
  }
}
