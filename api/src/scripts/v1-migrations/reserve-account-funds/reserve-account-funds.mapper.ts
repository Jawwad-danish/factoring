import { ReserveAccountFundsEntity } from '@module-persistence/entities';
import Big from 'big.js';

export const buildEntity = (
  reserveAccountFunds: any,
): ReserveAccountFundsEntity => {
  const entity = new ReserveAccountFundsEntity();
  entity.id = reserveAccountFunds.id;
  entity.clientId = reserveAccountFunds.client_id;
  entity.amount = Big(reserveAccountFunds.amount);
  entity.note = reserveAccountFunds.notes;
  return entity;
};
