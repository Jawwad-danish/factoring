import { DeepPartial } from '@core/types';
import {
  ClientBankAccount,
  ClientBankAccountStatus,
  CounterPartyStatus,
  ModernTreasuryAccount,
  PlaidAccount,
  Product,
  ProductName,
} from '@fs-bobtail/factoring/data';
import { UUID } from '@core/uuid';

export const buildStubClientBankAccount = (
  data?: DeepPartial<ClientBankAccount>,
): ClientBankAccount => {
  const model = new ClientBankAccount({
    id: UUID.get(),
    modernTreasuryAccount: buildStubModernTreasuryAccount(),
    plaidAccount: buildStubPlaidAccount(),
    products: [buildStubBankAccountProduct()],
    status: ClientBankAccountStatus.Active,
  });
  Object.assign(model, data);
  return model;
};

export const buildStubModernTreasuryAccount = (
  data?: DeepPartial<ModernTreasuryAccount>,
): ModernTreasuryAccount => {
  const model = new ModernTreasuryAccount({
    id: UUID.get(),
    externalAccountId: UUID.get(),
    status: CounterPartyStatus.VERIFIED,
    confirmedWire: true,
    wireRoutingNumber: '021000021',
    routingNumber: '312000032',
    account: '0000',
  });
  Object.assign(model, data);
  return model;
};

export const buildStubPlaidAccount = (
  data?: DeepPartial<PlaidAccount>,
): PlaidAccount => {
  const model = new PlaidAccount({
    bankAccountName: 'Chase',
    bankAccountOfficialName: 'Chase',
    bankAccountOwnerName: 'John',
    bankName: 'Chase',
  });
  Object.assign(model, data);
  return model;
};

export const buildStubBankAccountProduct = (
  data?: DeepPartial<Product>,
): Product => {
  const model = new Product({
    name: ProductName.Factoring,
  });
  Object.assign(model, data);
  return model;
};
