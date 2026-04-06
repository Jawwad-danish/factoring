import {
  DetailedAgingClientData,
  DetailedAgingDataTransformer,
  LightweightClientsAndBrokersMapping,
} from './detailed-aging.data-transformer';
import { InvoiceEntitySchema } from '@module-persistence/entities';
import Big from 'big.js';
import { LightweightBroker } from '@module-brokers';
import { buildStubRawDetailedAgingData } from '@module-reports';

describe('DetailedAgingDataTransformer', () => {
  let transformer: DetailedAgingDataTransformer;
  let mapping: LightweightClientsAndBrokersMapping;

  beforeEach(() => {
    mapping = {
      clients: new Map([
        [
          'client-1',
          {
            id: 'client-1',
            name: 'Test Client',
            mc: 'MC123',
            dot: 'DOT456',
            clientSuccessTeam: 'Team Alpha',
          } as DetailedAgingClientData,
        ],
      ]),
      brokers: new Map([
        [
          'broker-1',
          {
            id: 'broker-1',
            doingBusinessAs: 'Test Broker',
            mc: 'MC789',
            dot: 'DOT012',
          } as LightweightBroker,
        ],
      ]),
    };

    transformer = new DetailedAgingDataTransformer(mapping);
  });

  describe('doTransform', () => {
    it('should transform raw data with valid client and broker', () => {
      const rawData = buildStubRawDetailedAgingData();

      const result = transformer.doTransform(rawData);

      expect(result.purchasedDate).toEqual(new Date('2026-03-01T10:00:00Z'));
      expect(result.clientName).toBe('Test Client');
      expect(result.accountManager).toBe('Team Alpha');
      expect(result.clientMC).toBe('MC123');
      expect(result.clientDOT).toBe('DOT456');
      expect(result.brokerName).toBe('Test Broker');
      expect(result.brokerMC).toBe('MC789');
      expect(result.brokerDOT).toBe('DOT012');
      expect(result.loadNumber).toBe('LOAD123');
      expect(result.accountsReceivableValue.eq(new Big('1000.00'))).toBe(true);
      expect(result.approvedFactorFee.eq(new Big('50.00'))).toBe(true);
      expect(result.deduction.eq(new Big('10.00'))).toBe(true);
      expect(result.reserveFee.eq(new Big('20.00'))).toBe(true);
      expect(result.fundedValue).toBeInstanceOf(Big);
    });

    it('should handle missing client data with N/A defaults', () => {
      const rawData = buildStubRawDetailedAgingData({
        client_id: 'unknown-client',
      });

      const result = transformer.doTransform(rawData);

      expect(result.clientName).toBe('N/A');
      expect(result.accountManager).toBe('N/A');
      expect(result.clientMC).toBe('N/A');
      expect(result.clientDOT).toBe('N/A');
    });

    it('should handle missing broker data with N/A defaults', () => {
      const rawData = buildStubRawDetailedAgingData({
        broker_id: 'unknown-broker',
      });

      const result = transformer.doTransform(rawData);

      expect(result.brokerName).toBe('N/A');
      expect(result.brokerMC).toBe('N/A');
      expect(result.brokerDOT).toBe('N/A');
    });

    it('should calculate funded value correctly using payableAmount formula', () => {
      const rawData = buildStubRawDetailedAgingData();

      const result = transformer.doTransform(rawData);

      // fundedValue = AR - reserveFee - approvedFactorFee - deduction
      // 1000 - 20 - 50 - 10 = 920
      expect(result.fundedValue?.eq(new Big('920.00'))).toBe(true);
    });

    it('should handle zero values correctly', () => {
      const rawData = buildStubRawDetailedAgingData({
        [InvoiceEntitySchema.COLUMN_ACCOUNTS_RECEIVABLE_VALUE]: '0',
        [InvoiceEntitySchema.COLUMN_APPROVED_FACTOR_FEE]: '0',
        [InvoiceEntitySchema.COLUMN_DEDUCTION]: '0',
        [InvoiceEntitySchema.COLUMN_RESERVE_FEE]: '0',
      });

      const result = transformer.doTransform(rawData);

      expect(result.accountsReceivableValue.eq(new Big('0'))).toBe(true);
      expect(result.approvedFactorFee.eq(new Big('0'))).toBe(true);
      expect(result.deduction.eq(new Big('0'))).toBe(true);
      expect(result.reserveFee.eq(new Big('0'))).toBe(true);
      expect(result.fundedValue?.eq(new Big('0'))).toBe(true);
    });
  });
});
