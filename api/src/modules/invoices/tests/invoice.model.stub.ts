import { UUID } from '@core/uuid';
import { Invoice } from '@fs-bobtail/factoring/data';
import { buildStubBroker } from '@module-brokers/test';
import { buildStubClient } from '@module-clients/test';
import { buildStubUser } from '@module-common/test';
import Big from 'big.js';
import { buildStubActivityLog } from './activity-log.model.stub';

export const builStubInvoice = (data?: Partial<Invoice>): Invoice => {
  const user = buildStubUser();
  const invoice = new Invoice({
    id: UUID.get(),
    client: buildStubClient(),
    broker: buildStubBroker(),
    activities: [buildStubActivityLog()],
    documents: [],
    tags: [],
    loadNumber: 'load',
    note: 'note',
    memo: 'memo',
    lineHaulRate: new Big(10),
    detention: new Big(10),
    lumper: new Big(10),
    advance: new Big(10),
    approvedFactorFee: new Big(1),
    expedited: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: user,
    updatedBy: user,
  });
  if (data) {
    Object.assign(invoice, data);
  }
  return invoice;
};
