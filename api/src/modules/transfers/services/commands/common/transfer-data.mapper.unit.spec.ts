import { mockMikroORMProvider } from '@core/test';
import { EntityStubs } from '@module-persistence/test';
import { Test } from '@nestjs/testing';
import Big from 'big.js';
import { buildStubClient } from '../../../../clients/test';
import { TransferType } from '../../../api';
import {
  TransferDataMapper,
  TransferDestination,
} from './transfer-data.mapper';

const buildTransferDestination = (
  overrides?: Partial<TransferDestination>,
): TransferDestination => ({
  account: '987654321',
  routingNumber: '123456789',
  wireRoutingNumber: '021000021',
  clientExternalAccountId: 'ext-acc-1',
  clientExternalAccountName: 'Test Account',
  bankAccountOwnerName: 'John Doe Owner',
  companyName: 'Test Company',
  internalBankAccountId: 'internal-bank-1',
  bankName: 'Chase Bank',
  ...overrides,
});

describe('TransferDataMapper', () => {
  beforeEach(async () => {
    await Test.createTestingModule({
      providers: [mockMikroORMProvider],
    }).compile();
  });

  describe('batchPaymentToBankOfAmericaExpedite', () => {
    it('should map batch payment to BofaTransferRequest with correct fields', () => {
      const batchPayment = EntityStubs.buildStubClientBatchPayment();
      const clientPayment = EntityStubs.buildStubClientPayment({
        amount: new Big(500),
      });
      batchPayment.clientPayments.add(clientPayment);

      const destination = buildTransferDestination();
      const client = buildStubClient();

      const result = TransferDataMapper.batchPaymentToBankOfAmericaExpedite(
        batchPayment,
        destination,
        'https://webhook.test',
        client,
      );

      expect(result.batchPaymentId).toBe(batchPayment.id);
      expect(result.transferType).toBe(TransferType.Expedite);
      expect(result.webhookClientURL).toBe('https://webhook.test');
      expect(result.payments).toHaveLength(1);
      const payment = result.payments[0];
      expect(payment.amount).toBe(500);
      expect(payment.creditorName).toBe('John Doe Owner');
      expect(payment.creditorAccountNumber).toBe('987654321');
      expect(payment.creditorRoutingNumber).toBe('123456789');
      expect(payment.creditorBankName).toBe('Chase Bank');
      expect(payment.creditorPostalAddress).toEqual({
        addressLine: ['123 Test St'],
        city: 'Los Angeles',
        state: 'CA',
        postalCode: '90001',
      });
    });

    it('should map each client payment to a BofaPaymentRequest', () => {
      const batchPayment = EntityStubs.buildStubClientBatchPayment();
      const payment1 = EntityStubs.buildStubClientPayment({
        amount: new Big(500),
      });
      const payment2 = EntityStubs.buildStubClientPayment({
        amount: new Big(300),
      });
      batchPayment.clientPayments.add(payment1);
      batchPayment.clientPayments.add(payment2);

      const destination = buildTransferDestination();
      const client = buildStubClient();

      const result = TransferDataMapper.batchPaymentToBankOfAmericaExpedite(
        batchPayment,
        destination,
        'https://webhook.test',
        client,
      );

      expect(result.payments).toHaveLength(2);
      expect(result.payments[0].amount).toBe(500);
      expect(result.payments[1].amount).toBe(300);
    });

    it('should populate creditor details from transfer destination', () => {
      const batchPayment = EntityStubs.buildStubClientBatchPayment();
      batchPayment.clientPayments.add(
        EntityStubs.buildStubClientPayment({ amount: new Big(100) }),
      );

      const destination = buildTransferDestination();
      const client = buildStubClient();

      const result = TransferDataMapper.batchPaymentToBankOfAmericaExpedite(
        batchPayment,
        destination,
        'https://webhook.test',
        client,
      );

      const payment = result.payments[0];
      expect(payment.creditorName).toBe('John Doe Owner');
      expect(payment.creditorAccountNumber).toBe('987654321');
      expect(payment.creditorRoutingNumber).toBe('123456789');
      expect(payment.creditorBankName).toBe('Chase Bank');
    });

    it('should populate postal address from client business contact', () => {
      const batchPayment = EntityStubs.buildStubClientBatchPayment();
      batchPayment.clientPayments.add(
        EntityStubs.buildStubClientPayment({ amount: new Big(100) }),
      );

      const destination = buildTransferDestination();
      const client = buildStubClient();

      const result = TransferDataMapper.batchPaymentToBankOfAmericaExpedite(
        batchPayment,
        destination,
        'https://webhook.test',
        client,
      );

      const address = result.payments[0].creditorPostalAddress;
      expect(address.addressLine).toEqual(['123 Test St']);
      expect(address.city).toBe('Los Angeles');
      expect(address.state).toBe('CA');
      expect(address.postalCode).toBe('90001');
    });

    it('should throw when client has no business contact address', () => {
      const batchPayment = EntityStubs.buildStubClientBatchPayment();
      batchPayment.clientPayments.add(
        EntityStubs.buildStubClientPayment({ amount: new Big(100) }),
      );

      const destination = buildTransferDestination();
      const client = buildStubClient();
      client.clientContacts = [];

      expect(() =>
        TransferDataMapper.batchPaymentToBankOfAmericaExpedite(
          batchPayment,
          destination,
          'https://webhook.test',
          client,
        ),
      ).toThrow(
        'Client Address details (address, city) are missing to create Bank of America transfer',
      );
    });

    it('should return empty payments array when batch has no client payments', () => {
      const batchPayment = EntityStubs.buildStubClientBatchPayment();
      const destination = buildTransferDestination();
      const client = buildStubClient();

      const result = TransferDataMapper.batchPaymentToBankOfAmericaExpedite(
        batchPayment,
        destination,
        'https://webhook.test',
        client,
      );

      expect(result.payments).toHaveLength(0);
    });
  });
});
