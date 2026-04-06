import {
  FactoringCompanyEntity,
  PendingBuyoutEntity,
  PendingBuyoutsBatchEntity,
} from '@module-persistence';
import Big from 'big.js';

export const createPendingBuyoutEntity = (
  fileRow: Array<string>,
  clientId: string,
  batchEntity: PendingBuyoutsBatchEntity,
): PendingBuyoutEntity => {
  const [loadNumber, brokerMc, rate, buyoutDate, brokerName] = fileRow;
  const pendingBuyoutEntity = new PendingBuyoutEntity();
  pendingBuyoutEntity.clientId = clientId;
  pendingBuyoutEntity.loadNumber = loadNumber;
  pendingBuyoutEntity.paymentDate = new Date(buyoutDate);
  pendingBuyoutEntity.brokerMC = brokerMc;
  pendingBuyoutEntity.rate = rate ? Big(rate) : Big(0);
  pendingBuyoutEntity.batch = batchEntity;
  pendingBuyoutEntity.brokerName = brokerName;

  return pendingBuyoutEntity;
};

export const createFactoringCompanyEntity = (
  name: string,
): FactoringCompanyEntity => {
  const factoringCompanyEntity = new FactoringCompanyEntity();
  factoringCompanyEntity.name = name;
  return factoringCompanyEntity;
};
