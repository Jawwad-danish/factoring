import { v4 } from 'uuid';
import { BrokerContact, BrokerRole } from '../data/model';

export const buildStubBrokerContact = () =>
  ({
    id: v4(),
    name: 'Jamie Doe',
    phone: '+1-555-0000',
    email: 'jamie@acme.test',
    countryPhoneCode: 'US',
    role: BrokerRole.Accounting,
    isPrimary: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'someone',
    updatedBy: v4(),
  } as unknown as BrokerContact);
