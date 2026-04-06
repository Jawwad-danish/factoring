import { mockMikroORMProvider, mockToken } from '@core/test';
import { getDateInBusinessTimezone } from '@core/date-time';
import {
  BrokerPaymentStatus,
  BrokerPaymentType,
  TagDefinitionKey,
} from '@module-persistence/entities';
import { InvoiceEntityUtil } from '@module-persistence/util';
import { EntityStubs } from '@module-persistence/test';
import { Test, TestingModule } from '@nestjs/testing';
import Big from 'big.js';
import { buildStubCreateBrokerPaymentRequest } from '../../../../../test';
import { CreateBrokerPaymentUpdateInvoiceRule } from './create-broker-payment-update-invoice-rule';

describe('CreateBrokerPaymentUpdateInvoiceRule', () => {
  let rule: CreateBrokerPaymentUpdateInvoiceRule;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [mockMikroORMProvider, CreateBrokerPaymentUpdateInvoiceRule],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    rule = module.get(CreateBrokerPaymentUpdateInvoiceRule);
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('Rule should be defined', () => {
    expect(rule).toBeDefined();
  });

  describe('setPaymentDate', () => {
    it('When payment date is already set then no action is taken', async () => {
      const existingPaymentDate = new Date('2023-01-01');
      const invoice = EntityStubs.buildStubInvoice({
        brokerPayments: [EntityStubs.buildStubBrokerPayment()],
        paymentDate: existingPaymentDate,
        accountsReceivableValue: new Big(200),
      });

      const result = await rule.run({
        brokerPayment: EntityStubs.buildStubBrokerPayment(),
        invoice,
        request: buildStubCreateBrokerPaymentRequest({
          amount: new Big(200),
          type: BrokerPaymentType.Ach,
        }),
      });
      expect(result.actions.length).toBe(1);
      expect(result.actions[0].key).toBe(
        TagDefinitionKey.BROKER_PAYMENT_IN_FULL,
      );
      expect(result.actions[0].noteDetails?.getText()).toContain(
        'Payment posted for $2.00 via ACH',
      );
      expect(invoice.paymentDate).toEqual(existingPaymentDate);
    });

    it('When payment date is null then it sets current UTC date', async () => {
      const invoice = EntityStubs.buildStubInvoice({
        brokerPayments: [EntityStubs.buildStubBrokerPayment()],
        accountsReceivableValue: new Big(200),
      });

      const result = await rule.run({
        brokerPayment: EntityStubs.buildStubBrokerPayment(),
        invoice,
        request: buildStubCreateBrokerPaymentRequest({
          amount: new Big(200),
          type: BrokerPaymentType.Ach,
          batchDate: new Date('2023-01-15'),
        }),
      });

      expect(result.isEmpty()).toBeFalsy();
      expect(result.actions).toHaveLength(2);
      expect(result.actions[0].key).toBe(TagDefinitionKey.UPDATE_INVOICE);
      expect(result.actions[0].noteDetails?.getText()).toBe(
        'Assigned initial broker payment date',
      );
      expect(result.actions[1].key).toBe(
        TagDefinitionKey.BROKER_PAYMENT_IN_FULL,
      );
      expect(result.actions[1].noteDetails?.getText()).toContain(
        'Payment posted for $2.00 via ACH',
      );
      expect(invoice.paymentDate?.getDate()).toEqual(
        getDateInBusinessTimezone().toDate().getDate(),
      );
    });
  });

  describe('setInvoiceBrokerPaymentStatus', () => {
    it('When broker payment status is NonPayment and tag is provided then uses tag', async () => {
      const request = buildStubCreateBrokerPaymentRequest({
        tag: {
          key: TagDefinitionKey.BROKER_PAYMENT_DELETE,
          note: 'Payment deleted',
        },
      });

      jest
        .spyOn(InvoiceEntityUtil, 'calculateBrokerPaymentStatus')
        .mockResolvedValue(BrokerPaymentStatus.NonPayment);

      const invoice = EntityStubs.buildStubInvoice({
        paymentDate: new Date('2023-01-01'),
      });

      const result = await rule.run({
        brokerPayment: EntityStubs.buildStubBrokerPayment(),
        invoice,
        request,
      });

      expect(result.isEmpty()).toBeFalsy();
      expect(result.actions).toHaveLength(1);
      expect(result.actions[0].key).toBe(
        TagDefinitionKey.BROKER_PAYMENT_DELETE,
      );
      expect(result.actions[0].noteDetails?.getText()).toBe('Payment deleted');
      expect(invoice.brokerPaymentStatus).toBe(BrokerPaymentStatus.NonPayment);
    });

    it('When broker payment status is NotReceived then creates proper activity', async () => {
      const request = buildStubCreateBrokerPaymentRequest({
        amount: new Big(5000),
        type: BrokerPaymentType.Ach,
        batchDate: new Date('2023-01-15'),
      });

      jest
        .spyOn(InvoiceEntityUtil, 'calculateBrokerPaymentStatus')
        .mockResolvedValue(BrokerPaymentStatus.NotReceived);

      const invoice = EntityStubs.buildStubInvoice({
        paymentDate: new Date('2023-01-01'),
      });

      const result = await rule.run({
        brokerPayment: EntityStubs.buildStubBrokerPayment(),
        invoice,
        request,
      });

      expect(result.isEmpty()).toBeFalsy();
      expect(result.actions).toHaveLength(1);
      expect(result.actions[0].key).toBe(
        TagDefinitionKey.BROKER_PAYMENT_NOT_RECEIVED,
      );
      expect(result.actions[0].noteDetails?.getText()).toContain(
        'Payment posted for $50.00 via ACH, batch date 01/15/23',
      );
      expect(invoice.brokerPaymentStatus).toBe(BrokerPaymentStatus.NotReceived);
    });

    it('When broker payment status is Partial then creates proper activity', async () => {
      const request = buildStubCreateBrokerPaymentRequest({
        amount: new Big(2500),
        type: BrokerPaymentType.Check,
        batchDate: new Date('2023-02-20'),
      });

      jest
        .spyOn(InvoiceEntityUtil, 'calculateBrokerPaymentStatus')
        .mockResolvedValue(BrokerPaymentStatus.ShortPaid);

      const invoice = EntityStubs.buildStubInvoice({
        paymentDate: new Date('2023-01-01'),
      });

      const result = await rule.run({
        brokerPayment: EntityStubs.buildStubBrokerPayment(),
        invoice,
        request,
      });

      expect(result.isEmpty()).toBeFalsy();
      expect(result.actions).toHaveLength(1);
      expect(result.actions[0].key).toBe(
        TagDefinitionKey.BROKER_PAYMENT_SHORTPAY,
      );
      expect(result.actions[0].noteDetails?.getText()).toContain(
        'Payment posted for $25.00 via Check, batch date 02/20/23',
      );
      expect(invoice.brokerPaymentStatus).toBe(BrokerPaymentStatus.ShortPaid);
    });

    it('When broker payment status is Full then creates proper activity', async () => {
      const request = buildStubCreateBrokerPaymentRequest({
        amount: new Big(10000),
        type: BrokerPaymentType.Check,
        batchDate: new Date('2023-03-10'),
      });

      jest
        .spyOn(InvoiceEntityUtil, 'calculateBrokerPaymentStatus')
        .mockResolvedValue(BrokerPaymentStatus.InFull);

      const invoice = EntityStubs.buildStubInvoice();

      const result = await rule.run({
        brokerPayment: EntityStubs.buildStubBrokerPayment(),
        invoice,
        request,
      });

      expect(result.isEmpty()).toBeFalsy();
      expect(result.actions).toHaveLength(2);
      expect(result.actions[0].key).toBe(TagDefinitionKey.UPDATE_INVOICE);
      expect(result.actions[0].noteDetails?.getText()).toBe(
        'Assigned initial broker payment date',
      );
      expect(result.actions[1].key).toBe(
        TagDefinitionKey.BROKER_PAYMENT_IN_FULL,
      );
      expect(result.actions[1].noteDetails?.getText()).toContain(
        'Payment posted for $100.00 via Check, batch date 03/10/23',
      );
      expect(invoice.paymentDate?.getDate()).toEqual(
        getDateInBusinessTimezone().toDate().getDate(),
      );
      expect(invoice.brokerPaymentStatus).toBe(BrokerPaymentStatus.InFull);
    });
  });

  describe('Complete rule execution', () => {
    it('When both payment date and status need updating then creates two actions', async () => {
      const request = buildStubCreateBrokerPaymentRequest({
        amount: new Big(7500),
        type: BrokerPaymentType.Ach,
        batchDate: new Date('2023-04-05'),
      });

      jest
        .spyOn(InvoiceEntityUtil, 'calculateBrokerPaymentStatus')
        .mockResolvedValue(BrokerPaymentStatus.InFull);

      const invoice = EntityStubs.buildStubInvoice({
        paymentDate: null,
      });

      const result = await rule.run({
        brokerPayment: EntityStubs.buildStubBrokerPayment(),
        invoice,
        request,
      });

      expect(result.isEmpty()).toBeFalsy();
      expect(result.actions).toHaveLength(2);

      expect(result.actions[0].key).toBe(TagDefinitionKey.UPDATE_INVOICE);
      expect(result.actions[0].noteDetails?.getText()).toBe(
        'Assigned initial broker payment date',
      );

      expect(result.actions[1].key).toBe(
        TagDefinitionKey.BROKER_PAYMENT_IN_FULL,
      );
      expect(result.actions[1].noteDetails?.getText()).toContain(
        'Payment posted for $75.00 via ACH, batch date 04/05/23',
      );

      expect(invoice.paymentDate?.getDate()).toEqual(
        getDateInBusinessTimezone().toDate().getDate(),
      );
      expect(invoice.brokerPaymentStatus).toBe(BrokerPaymentStatus.InFull);
    });

    it('When payment date is already set and status needs updating then creates one action', async () => {
      const existingPaymentDate = new Date('2023-01-01');
      const request = buildStubCreateBrokerPaymentRequest({
        amount: new Big(2000),
        type: BrokerPaymentType.Check,
        batchDate: new Date('2023-05-12'),
      });

      const invoice = EntityStubs.buildStubInvoice({
        brokerPayments: [
          EntityStubs.buildStubBrokerPayment({
            amount: new Big(500),
          }),
          EntityStubs.buildStubBrokerPayment({
            amount: new Big(2000),
          }),
        ],
        paymentDate: existingPaymentDate,
        accountsReceivableValue: new Big(5000),
      });

      jest
        .spyOn(InvoiceEntityUtil, 'calculateBrokerPaymentStatus')
        .mockResolvedValue(BrokerPaymentStatus.ShortPaid);

      const result = await rule.run({
        brokerPayment: EntityStubs.buildStubBrokerPayment(),
        invoice,
        request,
      });

      expect(result.isEmpty()).toBeFalsy();
      expect(result.actions).toHaveLength(1);
      expect(result.actions[0].key).toBe(
        TagDefinitionKey.BROKER_PAYMENT_SHORTPAY,
      );
      expect(result.actions[0].noteDetails?.getText()).toContain(
        'Payment posted for $20.00 via Check, batch date 05/12/23',
      );

      expect(invoice.paymentDate).toEqual(existingPaymentDate); // Unchanged
      expect(invoice.brokerPaymentStatus).toBe(BrokerPaymentStatus.ShortPaid);
    });
  });
});
