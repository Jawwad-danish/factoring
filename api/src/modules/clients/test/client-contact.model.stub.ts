import { UUID } from '@core/uuid';
import {
  ClientContact,
  ClientContactAddress,
  ClientContactPhone,
  ClientContactType,
  PhoneType,
} from '../data';

export const buildStubClientContact = (
  data?: Partial<ClientContact>,
): ClientContact => {
  return new ClientContact({
    id: data?.id ?? UUID.get(),
    type: data?.type ?? ClientContactType.BUSINESS,
    primary: data?.primary ?? false,
    email: data?.email ?? 'contact@test.com',
    name: data?.name ?? 'Test Contact',
    notifications: data?.notifications ?? false,
    address:
      data?.address ??
      new ClientContactAddress({
        id: UUID.get(),
        country: 'US',
        state: 'CA',
        city: 'Los Angeles',
        address: '123 Test St',
        zip: '90001',
      }),
    contactPhones: data?.contactPhones ?? [
      new ClientContactPhone({
        id: UUID.get(),
        phone: '+1234567890',
        phoneType: PhoneType.MOBILE,
      }),
    ],
  });
};
