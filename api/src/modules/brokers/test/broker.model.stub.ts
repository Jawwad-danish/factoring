import { buildStubUser } from '@module-common/test';
import { UUID } from '@core/uuid';
import { BrokerRating } from '../lib';
import {
  Broker,
  BrokerAddress,
  BrokerAddressType,
  BrokerContact,
  BrokerEmail,
  BrokerEmailType,
  BrokerRole,
} from '../data/model';
import { buildStubTagDefinition } from '@module-tag-definitions/test';
import { RecordStatus, TagDefinitionKey } from '@module-persistence';
import Big from 'big.js';

export const buildStubBroker = (data?: Partial<Broker>): Broker => {
  const user = buildStubUser();
  const broker = new Broker({
    id: UUID.get(),
    mc: 'mc',
    dot: 'dot',
    legalName: 'Acme LLC',
    phone: '(760) 241-2277',
    rating: BrokerRating.A,
    externalRating: BrokerRating.A,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: user,
    updatedBy: user,
    factoringConfig: {
      id: UUID.get(),
      recordStatus: RecordStatus.Active,
      limitAmount:
        data?.factoringConfig?.limitAmount === null
          ? null
          : data?.factoringConfig?.limitAmount ?? new Big(500000),
      brokerId: UUID.get(),
      limitHistory: [
        {
          amount: new Big(500000),
          note: 'Test',
          id: UUID.get(),
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: user,
          updatedBy: user,
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: user,
      updatedBy: user,
      processingNotes: [],
    },
  });
  broker.addresses = [
    new BrokerAddress({
      id: UUID.get(),
      address: '14689 Valley Center Dr',
      streetAddress: '14689 Valley Center Dr',
      city: 'Victorville',
      state: 'California',
      zip: '92395',
      type: BrokerAddressType.Office,
    }),
  ];
  broker.emails = [
    new BrokerEmail({
      id: UUID.get(),
      email: 'test@bobtail.com',
      type: BrokerEmailType.NOA,
    }),
    new BrokerEmail({
      id: UUID.get(),
      email: 'test@bobtail.com',
      type: BrokerEmailType.PaymentStatus,
    }),
    new BrokerEmail({
      id: UUID.get(),
      email: 'test@bobtail.com',
      type: BrokerEmailType.InvoiceDelivery,
    }),
  ];
  broker.contacts = [
    new BrokerContact({
      id: '76473e45-8499-4801-bb24-9c01bcd11e6b',
      name: 'John Smith',
      countryPhoneCode: 'US',
      phone: '765-461-9920 x321',
      email: 'john@smith.com',
      role: BrokerRole.Other,
      isPrimary: true,
    }),
  ];
  broker.tags = [
    buildStubTagDefinition(TagDefinitionKey.INVOICE_EMAIL_BLOCKED),
    buildStubTagDefinition(TagDefinitionKey.BROKER_REQUIRE_EMAIL),
  ];
  Object.assign(broker, data);
  return broker;
};
