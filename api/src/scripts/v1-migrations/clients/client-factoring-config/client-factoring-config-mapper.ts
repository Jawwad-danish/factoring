import { EntityManager } from '@mikro-orm/core';
import { DatabaseService } from '@module-database';
import {
  ClientFactoringRateReasonRepository,
  ClientReserveRateReasonRepository,
  ClientStatusReasonConfigRepository,
} from '@module-persistence';
import {
  ClientFactoringConfigsEntity,
  ClientFactoringRateReason,
  ClientFactoringRateReasonAssocEntity,
  ClientFactoringRateReasonEntity,
  ClientFactoringStatus,
  ClientLimitAssocEntity,
  ClientPaymentPlanAssocEntity,
  ClientReserveRateReason,
  ClientReserveRateReasonAssocEntity,
  ClientReserveRateReasonEntity,
  ClientStatusReason,
  ClientStatusReasonAssocEntity,
  ClientStatusReasonConfigEntity,
  UserEntity,
  ClientFactoringUnderwritingNotesEntity,
  ClientFactoringUnderwritingSubject,
  LeadAttributionType,
} from '@module-persistence/entities';
import Big from 'big.js';
import { getSystemID } from 'src/scripts/util';

export const clientFactoringStatusMapping: {
  [key: string]: ClientFactoringStatus;
} = {
  pending: ClientFactoringStatus.Onboarding,
  active: ClientFactoringStatus.Active,
  'on hold': ClientFactoringStatus.Hold,
  'out of business': ClientFactoringStatus.Hold,
  released: ClientFactoringStatus.Released,
};

const clientFactoringUnderwritingSubjectMapping: {
  [key: string]: ClientFactoringUnderwritingSubject;
} = {
  'Corporation Documents':
    ClientFactoringUnderwritingSubject.CorporationDocuments,
  UCC: ClientFactoringUnderwritingSubject.Ucc,
  '8821': ClientFactoringUnderwritingSubject.Form8821,
  License: ClientFactoringUnderwritingSubject.License,
  Other: ClientFactoringUnderwritingSubject.Other,
};

export function buildClientFactoringConfig(
  clientData: any,
): ClientFactoringConfigsEntity {
  const entity = new ClientFactoringConfigsEntity();
  entity.clientId = clientData.id;
  entity.status = clientFactoringStatusMapping[clientData.status];
  entity.paymentPlan = clientData.payment_plan_details;
  entity.factoringRatePercentage = new Big(clientData.factor_rate_percentage);
  entity.reserveRatePercentage = new Big(clientData.reserve_rate_percentage);
  entity.updatedBy = clientData.updated_by;
  entity.verificationPercentage = new Big(0);
  entity.vip = clientData.vip_status;
  entity.requiresVerification = clientData.requires_verification;
  entity.ccInEmails = clientData.cc_in_emails;
  entity.createdAt = new Date(clientData.created_at);
  entity.updatedAt = new Date(clientData.updated_at);
  entity.expediteTransferOnly = clientData.expedite_flag;
  entity.leadAttribution = leadAttributionMapping(clientData.lead_attribution);
  entity.acceptedFeeIncrease =
    clientData.metadata?.factoringRateIncrease?.accepted || false;
  entity.clientLimitAmount = clientData.client_limit
    ? new Big(clientData.client_limit)
    : null;
  entity.insuranceAgency = clientData.insurance_agency;
  entity.insuranceCompany = clientData.insurance_company;
  entity.insuranceMonthlyPaymentPerTruck = new Big(
    clientData.insurance_monthly_payment_per_truck ?? 0,
  );
  entity.insuranceRenewalDate = clientData.insurance_renewal_date
    ? new Date(clientData.insurance_renewal_date)
    : null;
  entity.ofacVerified = clientData.ofac_verified;
  entity.carrier411Alerts = clientData.carrier_411_alerts;
  entity.taxGuardAlerts = clientData.tax_guard_alerts;
  entity.dryvanTrucksAmount = clientData.dryvan_trucks_amount;
  entity.refrigeratedTrucksAmount = clientData.refrigerated_trucks_amount;
  entity.flatbedTrucksAmount = clientData.flatbed_trucks_amount;
  entity.stepdeckTrucksAmount = clientData.stepdeck_trucks_amount;
  entity.leasedTrucksAmount = clientData.leased_trucks_amount;
  entity.otherTrucksAmount = clientData.other_trucks_amount;
  entity.doneSubmittingInvoices = clientData.done_submitting_invoices_flag;
  entity.expediteTransferOnly = clientData.expedite_flag;
  entity.quickbooksId = clientData.quickbooks_customer_id;
  entity.quickbooksName = clientData.quickbooks_customer_name;
  return entity;
}

export const addUnderwritingNotes = (
  clientFactoringConfig: ClientFactoringConfigsEntity,
  item: any,
  em: EntityManager,
) => {
  const items = item?.client_underwriting_updates?.map((update: any) => {
    const entity = new ClientFactoringUnderwritingNotesEntity();
    entity.notes = update.note || null;
    entity.subject = clientFactoringUnderwritingSubjectMapping[update.subject];
    entity.createdAt = new Date(update.created_at);
    entity.createdBy = update.created_by
      ? em.getReference(UserEntity, update.created_by)
      : em.getReference(UserEntity, getSystemID());
    entity.updatedBy = entity.createdBy;
    entity.config = clientFactoringConfig;
    return entity;
  });
  clientFactoringConfig.underwriting.add(items);
};

export const addPaymentPlanHistory = (
  clientFactoringConfig: ClientFactoringConfigsEntity,
  item: any,
  em: EntityManager,
) => {
  const items = item?.payment_plan_history?.map((historyItem: any) => {
    const assocEntity = new ClientPaymentPlanAssocEntity();
    assocEntity.paymentPlan = historyItem.payment_plan_details || null;
    assocEntity.note = historyItem.note || null;
    assocEntity.createdAt = new Date(historyItem.created_at);
    assocEntity.createdBy = item.created_by
      ? em.getReference(UserEntity, item.created_by)
      : em.getReference(UserEntity, getSystemID());
    assocEntity.config = clientFactoringConfig;
    return assocEntity;
  });
  clientFactoringConfig.paymentPlanHistory.add(items);
};

export const addClientLimitHistory = (
  clientFactoringConfig: ClientFactoringConfigsEntity,
  item: any,
  em: EntityManager,
) => {
  const items = item?.client_limit_history?.map((historyItem: any) => {
    const assocEntity = new ClientLimitAssocEntity();
    assocEntity.clientLimitAmount = historyItem.client_limit
      ? new Big(historyItem.client_limit)
      : null;
    assocEntity.note = historyItem.note || '';
    assocEntity.createdAt = new Date(historyItem.created_at);
    assocEntity.createdBy = item.created_by
      ? em.getReference(UserEntity, item.created_by)
      : em.getReference(UserEntity, getSystemID());
    assocEntity.config = clientFactoringConfig;
    return assocEntity;
  });
  clientFactoringConfig.clientLimitHistory.add(items);
};

export const addFactoringRateHistory = (
  entity: ClientFactoringConfigsEntity,
  item: any,
  em: EntityManager,
  clientFactoringRateReasonEntities: ClientFactoringRateReasonEntity[],
) => {
  item?.factor_rate_change_history?.forEach((historyItem) => {
    const reasonEntity = clientFactoringRateReasonEntities.find(
      (reason) =>
        reason.reason ===
        getFactoringRateReasonMapping(historyItem.factor_rate_change_reason),
    );
    if (reasonEntity) {
      const reasonAssocEntity = new ClientFactoringRateReasonAssocEntity();
      reasonAssocEntity.createdAt = new Date(historyItem.created_at);
      reasonAssocEntity.factoringRatePercentage = Big(
        historyItem.factor_rate_percentage,
      );
      reasonAssocEntity.note = historyItem.note || '';
      reasonAssocEntity.config = entity;
      reasonAssocEntity.reason = reasonEntity;
      reasonAssocEntity.createdBy = item.created_by
        ? em.getReference(UserEntity, item.created_by)
        : em.getReference(UserEntity, getSystemID());
      entity.factoringRateHistory.add(reasonAssocEntity);
    } else {
      console.log(
        `Cound not find a factor reason mapping for: [${historyItem.factor_rate_change_reason}] `,
      );
    }
  });
};

export const getFactoringRateReasons = async (
  databaseService: DatabaseService,
  clientFactoringRateReasonRepository: ClientFactoringRateReasonRepository,
) => {
  return databaseService.withRequestContext(() =>
    clientFactoringRateReasonRepository.findAll({}),
  );
};

export const getFactoringRateReasonMapping = (
  reason: string,
): ClientFactoringRateReason => {
  switch (reason) {
    case 'lower rate request':
      return ClientFactoringRateReason.LowerRateRequest;
    case 'rate correction':
      return ClientFactoringRateReason.RateCorrection;
    case 'rate increase':
      return ClientFactoringRateReason.RateIncrease;
    case 'none':
    default:
      return ClientFactoringRateReason.None;
  }
};

export const addReserveRateHistory = (
  entity: ClientFactoringConfigsEntity,
  item: any,
  em: EntityManager,
  clientReserveRateReasonEntities: ClientReserveRateReasonEntity[],
) => {
  item?.reserve_rate_change_history?.forEach((historyItem) => {
    const reasonEntity = clientReserveRateReasonEntities.find(
      (reason) =>
        reason.reason ===
        getReserveRateReasonMapping(historyItem.reserve_rate_change_reason),
    );
    if (reasonEntity) {
      const reasonAssocEntity = new ClientReserveRateReasonAssocEntity();
      reasonAssocEntity.createdAt = new Date(historyItem.created_at);
      reasonAssocEntity.reserveRatePercentage = Big(
        historyItem.reserve_rate_percentage,
      );
      reasonAssocEntity.note = historyItem.note || '';
      reasonAssocEntity.config = entity;
      reasonAssocEntity.reserveRateReason = reasonEntity;
      reasonAssocEntity.createdBy = item.created_by
        ? em.getReference(UserEntity, item.created_by)
        : em.getReference(UserEntity, getSystemID());
      entity.reserveRateHistory.add(reasonAssocEntity);
    } else {
      console.log(
        `Cound not find a reserve reason mapping for: [${historyItem.reserve_rate_change_reason}] `,
      );
    }
  });
};

export const getReserveRateReasonMapping = (
  reason: string,
): ClientReserveRateReason => {
  switch (reason) {
    case 'dilution rate':
      return ClientReserveRateReason.DilutionRate;
    case 'volume':
      return ClientReserveRateReason.Volume;
    case 'high risk brokers':
      return ClientReserveRateReason.HighRiskBrokers;
    case 'general risk':
      return ClientReserveRateReason.GeneralRisk;
    case 'none':
      return ClientReserveRateReason.None;
    case 'other':
    default:
      return ClientReserveRateReason.Other;
  }
};

export const getReserveRateReasons = async (
  databaseService: DatabaseService,
  clientReserveRateReasonRepository: ClientReserveRateReasonRepository,
) => {
  return databaseService.withRequestContext(() =>
    clientReserveRateReasonRepository.findAll({}),
  );
};

export const addStatusHistory = (
  entity: ClientFactoringConfigsEntity,
  item: any,
  em: EntityManager,
  clientStatusReasonConfigEntity: ClientStatusReasonConfigEntity[],
) => {
  item?.status_change_history?.forEach((historyItem) => {
    const reasonEntity = clientStatusReasonConfigEntity.find(
      (reason) =>
        reason.reason ===
          getStatusReasonMapping(historyItem.status_change_reason) &&
        reason.status === clientFactoringStatusMapping[historyItem.status],
    );
    if (reasonEntity) {
      const reasonAssocEntity = new ClientStatusReasonAssocEntity();
      reasonAssocEntity.createdAt = new Date(historyItem.created_at);
      reasonAssocEntity.note = buildReasonNote(
        historyItem.note,
        historyItem.status_change_reason,
      );
      reasonAssocEntity.config = entity;
      reasonAssocEntity.clientStatusReasonConfig = reasonEntity;
      reasonAssocEntity.createdBy = item.created_by
        ? em.getReference(UserEntity, item.created_by)
        : em.getReference(UserEntity, getSystemID());
      entity.statusHistory.add(reasonAssocEntity);
    } else {
      console.log(
        `Cound not find a status reason mapping for: [${historyItem.status_change_reason}] `,
      );
    }
  });
};

export const getStatusReasons = async (
  databaseService: DatabaseService,
  clientStatusReasonConfigRepository: ClientStatusReasonConfigRepository,
) => {
  return databaseService.withRequestContext(() =>
    clientStatusReasonConfigRepository.findAll({}),
  );
};

export const getStatusReasonMapping = (reason: string): ClientStatusReason => {
  switch (reason) {
    case 'FMCSA issue':
      return ClientStatusReason.FMCSAIssues;
    case 'fraud investigation':
      return ClientStatusReason.Fraud;
    case 'insurance issue':
      return ClientStatusReason.InsuranceIssues;
    case 'not submitting invoices':
      return ClientStatusReason.Inactivity;
    case 'buyout':
      return ClientStatusReason.BuyoutInProgress;
    case 'possible double factor':
      return ClientStatusReason.Fraud;
    case 'write off':
      return ClientStatusReason.PreviousWriteOff;
    case 'client limit exceeded':
      return ClientStatusReason.ClientLimitExceeded;
    case 'competitor':
      return ClientStatusReason.SwitchedFactoringCompany;
    case 'stopped factoring':
      return ClientStatusReason.NoLongerFactoring;
    case 'other':
    case 'none':
    case 'unresponsive for invoice issues':
    case 'requesting a loan':
    case 'out of business': // v1 key value for lost authority
    default:
      return ClientStatusReason.Other;
  }
};

const leadAttributionMapping = (
  leadAttribution: string,
): LeadAttributionType | null => {
  switch (leadAttribution) {
    case 'cold calling':
      return LeadAttributionType.ColdCalling;
    case 'existing customer':
      return LeadAttributionType.ExistingCustomer;
    case 'web':
      return LeadAttributionType.Web;
    case 'referral':
      return LeadAttributionType.Referral;
    case 'email':
      return LeadAttributionType.Email;
    default:
      return null;
  }
};

const buildReasonNote = (note: string, reason: string): string => {
  let builtNote: string = '';
  if (note) {
    builtNote += note;
  }
  if (reason === 'unresponsive for invoice issues') {
    builtNote.concat('; Unresponsive for invoice issues');
  }
  if (reason === 'requesting a loan') {
    builtNote.concat('; Requesting a loan');
  }
  if (reason === 'out of business') {
    builtNote.concat('; Lost authority');
  }
  return builtNote;
};
