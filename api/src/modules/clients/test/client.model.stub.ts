import { UUID } from '@core/uuid';
import { buildStubUser } from '@module-common/test';
import {
  ClientFactoringRateReason,
  ClientFactoringStatus,
  ClientReserveRateReason,
  ClientStatusReason,
  RecordStatus,
} from '@module-persistence/entities';
import { ProcessingNotes } from '@module-processing-notes';
import Big from 'big.js';
import {
  AuthorityState,
  Client,
  ClientDocument,
  ClientDocumentType,
  ClientFactoringConfig,
  ClientLimitHistory,
  ClientReserveRateHistory,
  ClientStatusHistory,
  InsuranceStatus,
} from '../data';
import { ClientFactoringRateHistory } from '../data/client-factoring-rate-history.model';
import { buildStubClientBankAccount } from './client-bank-account.model.stub';
import { buildStubClientContact } from './client-contact.model.stub';

export const buildStubClient = (data?: Partial<Client>): Client => {
  const user = buildStubUser();
  const clientId = data?.id ?? UUID.get();
  return new Client({
    id: clientId,
    name: 'Acme LLC',
    shortName: 'Acme',
    mc: 'mc1',
    dot: 'dot1',
    ein: 'ein1',
    commonAuthorityStatus: data?.commonAuthorityStatus ?? AuthorityState.Active,
    insuranceStatus: data?.insuranceStatus ?? InsuranceStatus.Active,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: user,
    updatedBy: user,
    documents: data?.documents ?? [
      new ClientDocument({
        id: UUID.get(),
        externalUrl: 'https://cdn.filestackcontent.com/lmJKn17Tamm48i2fUMg0',
        internalUrl: 'https://cdn.filestackcontent.com/lmJKn17Tamm48i2fUMg0',
        type: ClientDocumentType.NOTICE_OF_ASSIGNMENT,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: user,
        updatedBy: user,
        recordStatus: RecordStatus.Active,
      }),
    ],
    bankAccounts: [buildStubClientBankAccount()],
    factoringConfig: new ClientFactoringConfig({
      recordStatus: RecordStatus.Active,
      factoringRatePercentage: new Big(2.25),
      verificationPercentage: new Big(1),
      reserveRatePercentage: new Big(1.5),
      clientLimitAmount:
        data?.factoringConfig?.clientLimitAmount === null
          ? null
          : data?.factoringConfig?.clientLimitAmount ?? new Big(500000),
      acceptedFeeIncrease: true,
      status: data?.factoringConfig?.status ?? ClientFactoringStatus.Active,
      vip: false,
      requiresVerification:
        data?.factoringConfig?.requiresVerification ?? false,
      ccInEmails: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: user,
      updatedBy: user,
      clientSuccessTeam: {
        id: UUID.get(),
        name: 'Team 101 - Stub',
      },
      expediteTransferOnly: false,
      doneSubmittingInvoices: false,
      processingNotes: [
        new ProcessingNotes({
          clientId: clientId,
          brokerId: UUID.get(),
          notes: 'abc',
        }),
      ],
      factoringRateHistory: [
        new ClientFactoringRateHistory({
          id: UUID.get(),
          factoringRatePercentage: Big(2),
          factoringRateReason: ClientFactoringRateReason.RateIncrease,
        }),
      ],
      reserveRateHistory: [
        new ClientReserveRateHistory({
          id: UUID.get(),
          reserveRatePercentage: Big(2),
          reserveRateReason: ClientReserveRateReason.Other,
        }),
      ],
      statusHistory: [
        new ClientStatusHistory({
          id: UUID.get(),
          status: ClientFactoringStatus.Active,
          statusReason: ClientStatusReason.ReadyToFactor,
          note: 'Note',
        }),
      ],

      clientLimitHistory: [
        new ClientLimitHistory({
          id: UUID.get(),
          amount: new Big(500000),
          note: 'Note',
        }),
      ],
      paymentPlan: null,
      paymentPlanHistory: [],
    }),
    clientContacts: [buildStubClientContact()],
  });
};
