import { EntityStubs } from '@module-persistence/test';
import Big from 'big.js';
import { BrokerPaymentEntityUtil } from './broker-payment-entity-util';

describe('BrokerPaymentEntityUtil', () => {
  it('Total amount of broker payments is calculated correctly', async () => {
    const brokerPayments = [
      EntityStubs.buildStubBrokerPayment({
        amount: new Big(100),
      }),
      EntityStubs.buildStubBrokerPayment({
        amount: new Big(200),
      }),
      EntityStubs.buildStubBrokerPayment({
        amount: new Big(300),
      }),
    ];
    const total = BrokerPaymentEntityUtil.total(brokerPayments);
    expect(total.toNumber()).toBe(600);
  });
});
