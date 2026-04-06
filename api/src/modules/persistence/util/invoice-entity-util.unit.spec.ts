import { mockMikroORMProvider } from '@core/test';
import { EntityStubs } from '@module-persistence/test';
import { Test } from '@nestjs/testing';
import { BrokerPaymentStatus, RecordStatus } from '../entities';
import { InvoiceEntityUtil } from './invoice-entity-util';
import Big from 'big.js';

describe('InvoiceEntityUtil', () => {
  beforeEach(async () => {
    await Test.createTestingModule({
      providers: [mockMikroORMProvider],
    }).compile();
  });

  it('Invoice has active broker payments when only active broker payments', async () => {
    const invoice = EntityStubs.buildStubInvoice({
      brokerPayments: [
        EntityStubs.buildStubBrokerPayment({
          recordStatus: RecordStatus.Active,
        }),
      ],
    });
    const hasActiveBrokerPayments =
      await InvoiceEntityUtil.hasActiveBrokerPayments(invoice);
    expect(hasActiveBrokerPayments).toBe(true);
  });

  it('Invoice does not have active broker payments when only inactive broker payments', async () => {
    const invoice = EntityStubs.buildStubInvoice({
      brokerPayments: [
        EntityStubs.buildStubBrokerPayment({
          recordStatus: RecordStatus.Inactive,
        }),
      ],
    });
    const hasActiveBrokerPayments =
      await InvoiceEntityUtil.hasActiveBrokerPayments(invoice);
    expect(hasActiveBrokerPayments).toBe(false);
  });

  it('Invoice has active broker payments when active and inactive broker payments', async () => {
    const invoice = EntityStubs.buildStubInvoice({
      brokerPayments: [
        EntityStubs.buildStubBrokerPayment({
          recordStatus: RecordStatus.Active,
        }),
        EntityStubs.buildStubBrokerPayment({
          recordStatus: RecordStatus.Inactive,
        }),
      ],
    });
    const hasActiveBrokerPayments =
      await InvoiceEntityUtil.hasActiveBrokerPayments(invoice);
    expect(hasActiveBrokerPayments).toBe(true);
  });

  it('Only active broker payments are fetched from invoice', async () => {
    const invoice = EntityStubs.buildStubInvoice({
      brokerPayments: [
        EntityStubs.buildStubBrokerPayment({
          recordStatus: RecordStatus.Active,
        }),
        EntityStubs.buildStubBrokerPayment({
          recordStatus: RecordStatus.Inactive,
        }),
      ],
    });
    const activeBrokerPayments =
      await InvoiceEntityUtil.getActiveBrokerPayments(invoice);
    expect(activeBrokerPayments.length).toBe(1);
  });

  it('Invoice broker payment status is shortpaid when only one active broker payments', async () => {
    const invoice = EntityStubs.buildStubInvoice({
      accountsReceivableValue: new Big(100),
      brokerPayments: [
        EntityStubs.buildStubBrokerPayment({
          amount: new Big(50),
          recordStatus: RecordStatus.Active,
        }),
      ],
    });
    const brokerPaymentStatus =
      await InvoiceEntityUtil.calculateBrokerPaymentStatus(invoice);
    expect(brokerPaymentStatus).toBe(BrokerPaymentStatus.ShortPaid);
  });

  it('Invoice broker payment status is shortpaid when two active broker payments with amount less than invoice', async () => {
    const invoice = EntityStubs.buildStubInvoice({
      accountsReceivableValue: new Big(100),
      brokerPayments: [
        EntityStubs.buildStubBrokerPayment({
          amount: new Big(50),
          recordStatus: RecordStatus.Active,
        }),
        EntityStubs.buildStubBrokerPayment({
          amount: new Big(10),
          recordStatus: RecordStatus.Active,
        }),
      ],
    });
    const brokerPaymentStatus =
      await InvoiceEntityUtil.calculateBrokerPaymentStatus(invoice);
    expect(brokerPaymentStatus).toBe(BrokerPaymentStatus.ShortPaid);
  });

  it('Invoice broker payment status is in full when two active broker payments with amount is the same as the invoice', async () => {
    const invoice = EntityStubs.buildStubInvoice({
      accountsReceivableValue: new Big(100),
      brokerPayments: [
        EntityStubs.buildStubBrokerPayment({
          amount: new Big(50),
          recordStatus: RecordStatus.Active,
        }),
        EntityStubs.buildStubBrokerPayment({
          amount: new Big(50),
          recordStatus: RecordStatus.Active,
        }),
      ],
    });
    const brokerPaymentStatus =
      await InvoiceEntityUtil.calculateBrokerPaymentStatus(invoice);
    expect(brokerPaymentStatus).toBe(BrokerPaymentStatus.InFull);
  });

  it('Invoice broker payment status is in full when active broker payment amount is equal to that of the invoice', async () => {
    const invoice = EntityStubs.buildStubInvoice({
      accountsReceivableValue: new Big(100),
      brokerPayments: [
        EntityStubs.buildStubBrokerPayment({
          amount: new Big(100),
          recordStatus: RecordStatus.Active,
        }),
      ],
    });
    const brokerPaymentStatus =
      await InvoiceEntityUtil.calculateBrokerPaymentStatus(invoice);
    expect(brokerPaymentStatus).toBe(BrokerPaymentStatus.InFull);
  });

  it('Invoice broker payment status is overpay when active broker payment amount is greater then that of the invoice', async () => {
    const invoice = EntityStubs.buildStubInvoice({
      accountsReceivableValue: new Big(100),
      brokerPayments: [
        EntityStubs.buildStubBrokerPayment({
          amount: new Big(150),
          recordStatus: RecordStatus.Active,
        }),
      ],
    });
    const brokerPaymentStatus =
      await InvoiceEntityUtil.calculateBrokerPaymentStatus(invoice);
    expect(brokerPaymentStatus).toBe(BrokerPaymentStatus.Overpaid);
  });

  it('Invoice broker payment status is overpay when two active broker payments with smaller amounts but greater then that of the invoice', async () => {
    const invoice = EntityStubs.buildStubInvoice({
      accountsReceivableValue: new Big(100),
      brokerPayments: [
        EntityStubs.buildStubBrokerPayment({
          amount: new Big(70),
          recordStatus: RecordStatus.Active,
        }),
        EntityStubs.buildStubBrokerPayment({
          amount: new Big(70),
          recordStatus: RecordStatus.Active,
        }),
      ],
    });
    const brokerPaymentStatus =
      await InvoiceEntityUtil.calculateBrokerPaymentStatus(invoice);
    expect(brokerPaymentStatus).toBe(BrokerPaymentStatus.Overpaid);
  });

  it('Invoice broker payment status is non payment when one active broker payment with 0 amount', async () => {
    const invoice = EntityStubs.buildStubInvoice({
      accountsReceivableValue: new Big(100),
      brokerPayments: [
        EntityStubs.buildStubBrokerPayment({
          amount: new Big(0),
          recordStatus: RecordStatus.Active,
        }),
      ],
    });
    const brokerPaymentStatus =
      await InvoiceEntityUtil.calculateBrokerPaymentStatus(invoice);
    expect(brokerPaymentStatus).toBe(BrokerPaymentStatus.NonPayment);
  });

  it('Invoice broker payment status is shortpay when a 0 amount broker payment and a shortpay broker payment', async () => {
    const invoice = EntityStubs.buildStubInvoice({
      accountsReceivableValue: new Big(100),
      brokerPayments: [
        EntityStubs.buildStubBrokerPayment({
          amount: new Big(0),
          recordStatus: RecordStatus.Active,
        }),
        EntityStubs.buildStubBrokerPayment({
          amount: new Big(5),
          recordStatus: RecordStatus.Active,
        }),
      ],
    });
    const brokerPaymentStatus =
      await InvoiceEntityUtil.calculateBrokerPaymentStatus(invoice);
    expect(brokerPaymentStatus).toBe(BrokerPaymentStatus.ShortPaid);
  });

  it('Invoice broker payment status is in full when a 0 amount broker payment and a complete broker payment', async () => {
    const invoice = EntityStubs.buildStubInvoice({
      accountsReceivableValue: new Big(100),
      brokerPayments: [
        EntityStubs.buildStubBrokerPayment({
          amount: new Big(0),
          recordStatus: RecordStatus.Active,
        }),
        EntityStubs.buildStubBrokerPayment({
          amount: new Big(100),
          recordStatus: RecordStatus.Active,
        }),
      ],
    });
    const brokerPaymentStatus =
      await InvoiceEntityUtil.calculateBrokerPaymentStatus(invoice);
    expect(brokerPaymentStatus).toBe(BrokerPaymentStatus.InFull);
  });

  it('Invoice broker payment status is overpay when a 0 amount broker payment and a overpay broker payment', async () => {
    const invoice = EntityStubs.buildStubInvoice({
      accountsReceivableValue: new Big(100),
      brokerPayments: [
        EntityStubs.buildStubBrokerPayment({
          amount: new Big(0),
          recordStatus: RecordStatus.Active,
        }),
        EntityStubs.buildStubBrokerPayment({
          amount: new Big(150),
          recordStatus: RecordStatus.Active,
        }),
      ],
    });
    const brokerPaymentStatus =
      await InvoiceEntityUtil.calculateBrokerPaymentStatus(invoice);
    expect(brokerPaymentStatus).toBe(BrokerPaymentStatus.Overpaid);
  });
});
