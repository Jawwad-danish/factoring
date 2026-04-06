import Big from 'big.js';
import { transferableAmount, payableAmount, totalAmount } from './amounts';

describe('Formulas', () => {
  describe('Total amount', () => {
    it('Should return primary rate when only primary rate is defined', () => {
      const result = totalAmount({
        lineHaulRate: new Big(100),
        lumper: new Big(0),
        detention: new Big(0),
        advance: new Big(0),
      });
      expect(result.eq(100)).toBe(true);
    });

    it('Should return correct value when all values are defined', () => {
      const result = totalAmount({
        lineHaulRate: new Big(110),
        lumper: new Big(10),
        detention: new Big(10),
        advance: new Big(30),
      });
      expect(result.eq(100)).toBe(true);
    });

    it('Should return correct value when primary rate and advance are defined', () => {
      const result = totalAmount({
        lineHaulRate: new Big(100),
        lumper: new Big(0),
        detention: new Big(0),
        advance: new Big(30),
      });
      expect(result.eq(70)).toBe(true);
    });

    it('Should return correct value when primary rate and lumper are defined', () => {
      const result = totalAmount({
        lineHaulRate: new Big(100),
        lumper: new Big(10),
        detention: new Big(0),
        advance: new Big(0),
      });
      expect(result.eq(110)).toBe(true);
    });

    it('Should return correct value when primary rate and deduction are defined', () => {
      const result = totalAmount({
        lineHaulRate: new Big(100),
        lumper: new Big(0),
        detention: new Big(0),
        advance: new Big(0),
      });
      expect(result.eq(100)).toBe(true);
    });
  });

  describe('AR and Fees', () => {
    it('Should return proper values when no fees are defined', () => {
      const result = payableAmount({
        accountsReceivableValue: new Big(100),
        reserveFee: new Big(0),
        approvedFactorFee: new Big(0),
        deduction: new Big(0),
      });
      expect(result.toNumber()).toBe(100);
    });

    it('Should return proper values fees are defined', () => {
      const result = payableAmount({
        accountsReceivableValue: new Big(100),
        reserveFee: new Big(20),
        approvedFactorFee: new Big(10),
        deduction: new Big(5),
      });
      expect(result.toNumber()).toBe(65);
    });
  });

  describe('Transfer Formulas', () => {
    it('Should return proper value when no transfer fee is provided', () => {
      const payables = [
        {
          accountsReceivableValue: new Big(1000),
          reserveFee: new Big(10),
          approvedFactorFee: new Big(20),
          deduction: new Big(5),
        },
        {
          accountsReceivableValue: new Big(1000),
          reserveFee: new Big(10),
          approvedFactorFee: new Big(20),
          deduction: new Big(5),
        },
      ];
      const result = transferableAmount(payables);
      expect(result.toNumber()).toBe(1930);
    });

    it('Should return proper value when transfer fee is provided', () => {
      const payables = [
        {
          accountsReceivableValue: new Big(1000),
          reserveFee: new Big(10),
          approvedFactorFee: new Big(20),
          deduction: new Big(5),
        },
        {
          accountsReceivableValue: new Big(1000),
          reserveFee: new Big(10),
          approvedFactorFee: new Big(20),
          deduction: new Big(5),
        },
      ];
      const result = transferableAmount(payables, new Big(500));
      expect(result.toNumber()).toBe(1430);
    });
  });
});
