import { EntityStubs } from '@module-persistence/test';
import { InvoiceEntity } from '@module-persistence/entities';
import Big from 'big.js';
import { FieldEqualityManager } from './field-equality-manager';

describe('FieldEqualityManager', () => {
  describe('Number equality', () => {
    describe('Ignore decimals is true', () => {
      it('Rounding down', () => {
        const manager = new FieldEqualityManager<InvoiceEntity>('value', {
          number: {
            ignoreDecimals: true,
            roundingMode: 0,
          },
        });

        const invoice1 = EntityStubs.buildStubInvoice();
        const invoice2 = EntityStubs.buildStubInvoice();

        invoice1.value = new Big('100.15');
        invoice2.value = new Big('100.25');
        expect(manager.areFieldsEqual(invoice1, invoice2)).toBeTruthy();

        invoice1.value = new Big('100.15');
        invoice2.value = new Big('99.75');
        expect(manager.areFieldsEqual(invoice1, invoice2)).toBeFalsy();

        invoice1.value = new Big('100.15');
        invoice2.value = new Big('99.5');
        expect(manager.areFieldsEqual(invoice1, invoice2)).toBeFalsy();

        invoice1.value = new Big('100.5');
        invoice2.value = new Big('99.5');
        expect(manager.areFieldsEqual(invoice1, invoice2)).toBeFalsy();
      });

      it('Rounding half up', () => {
        const manager = new FieldEqualityManager<InvoiceEntity>('value', {
          number: {
            ignoreDecimals: true,
            roundingMode: 1,
          },
        });

        const invoice1 = EntityStubs.buildStubInvoice();
        const invoice2 = EntityStubs.buildStubInvoice();

        invoice1.value = new Big('100.15');
        invoice2.value = new Big('100.25');
        expect(manager.areFieldsEqual(invoice1, invoice2)).toBeTruthy();

        invoice1.value = new Big('100.15');
        invoice2.value = new Big('99.75');
        expect(manager.areFieldsEqual(invoice1, invoice2)).toBeTruthy();

        invoice1.value = new Big('100.15');
        invoice2.value = new Big('99.5');
        expect(manager.areFieldsEqual(invoice1, invoice2)).toBeTruthy();

        invoice1.value = new Big('100.5');
        invoice2.value = new Big('99.5');
        expect(manager.areFieldsEqual(invoice1, invoice2)).toBeFalsy();
      });

      it('Rounding half even', () => {
        const manager = new FieldEqualityManager<InvoiceEntity>('value', {
          number: {
            ignoreDecimals: true,
            roundingMode: 2,
          },
        });

        const invoice1 = EntityStubs.buildStubInvoice();
        const invoice2 = EntityStubs.buildStubInvoice();

        invoice1.value = new Big('100.15');
        invoice2.value = new Big('100.25');
        expect(manager.areFieldsEqual(invoice1, invoice2)).toBeTruthy();

        invoice1.value = new Big('100.15');
        invoice2.value = new Big('99.75');
        expect(manager.areFieldsEqual(invoice1, invoice2)).toBeTruthy();

        invoice1.value = new Big('100.15');
        invoice2.value = new Big('99.5');
        expect(manager.areFieldsEqual(invoice1, invoice2)).toBeTruthy();

        invoice1.value = new Big('100.5');
        invoice2.value = new Big('99.5');
        expect(manager.areFieldsEqual(invoice1, invoice2)).toBeTruthy();
      });

      it('Rounding up', () => {
        const manager = new FieldEqualityManager<InvoiceEntity>('value', {
          number: {
            ignoreDecimals: true,
            roundingMode: 3,
          },
        });

        const invoice1 = EntityStubs.buildStubInvoice();
        const invoice2 = EntityStubs.buildStubInvoice();

        invoice1.value = new Big('100.15');
        invoice2.value = new Big('100.25');
        expect(manager.areFieldsEqual(invoice1, invoice2)).toBeTruthy();

        invoice1.value = new Big('100.15');
        invoice2.value = new Big('99.75');
        expect(manager.areFieldsEqual(invoice1, invoice2)).toBeFalsy();

        invoice1.value = new Big('100.15');
        invoice2.value = new Big('99.5');
        expect(manager.areFieldsEqual(invoice1, invoice2)).toBeFalsy();

        invoice1.value = new Big('100.5');
        invoice2.value = new Big('99.5');
        expect(manager.areFieldsEqual(invoice1, invoice2)).toBeFalsy();
      });
    });

    describe('Ignore decimals is false', () => {
      it('Number equality is false when decimal fields are not ignored', () => {
        const equality = new FieldEqualityManager<InvoiceEntity>(
          'value',
        ).areFieldsEqual(
          EntityStubs.buildStubInvoice({
            value: new Big('100.15'),
          }),
          EntityStubs.buildStubInvoice({
            value: new Big('100.25'),
          }),
        );
        expect(equality).toBeFalsy();
      });

      it('Number equality if true when fields have the same value', () => {
        const equality = new FieldEqualityManager<InvoiceEntity>(
          'value',
        ).areFieldsEqual(
          EntityStubs.buildStubInvoice({
            value: new Big('100.1'),
          }),
          EntityStubs.buildStubInvoice({
            value: new Big('100.1'),
          }),
        );
        expect(equality).toBeTruthy();
      });
    });
  });

  describe('String equality', () => {
    it('String equality is true when fields are similar', () => {
      const equality = new FieldEqualityManager<InvoiceEntity>(
        'loadNumber',
      ).areFieldsEqual(
        EntityStubs.buildStubInvoice({
          loadNumber: 'inv01',
        }),
        EntityStubs.buildStubInvoice({
          loadNumber: 'inv01',
        }),
      );
      expect(equality).toBeTruthy();
    });

    it('String equality is false when fields are different', () => {
      const equality = new FieldEqualityManager<InvoiceEntity>(
        'loadNumber',
      ).areFieldsEqual(
        EntityStubs.buildStubInvoice({
          loadNumber: 'inv01',
        }),
        EntityStubs.buildStubInvoice({
          loadNumber: 'inv02',
        }),
      );
      expect(equality).toBeFalsy();
    });
  });

  describe('Date equality', () => {
    it('Date equality is true when fields are similar', () => {
      const now = new Date();
      const equality = new FieldEqualityManager<InvoiceEntity>(
        'purchasedDate',
      ).areFieldsEqual(
        EntityStubs.buildStubInvoice({
          purchasedDate: now,
        }),
        EntityStubs.buildStubInvoice({
          purchasedDate: now,
        }),
      );
      expect(equality).toBeTruthy();
    });

    it('Date equality is true when fields are different but within acceptable difference', () => {
      const now = new Date();
      const equality = new FieldEqualityManager<InvoiceEntity>(
        'purchasedDate',
      ).areFieldsEqual(
        EntityStubs.buildStubInvoice({
          purchasedDate: now,
        }),
        EntityStubs.buildStubInvoice({
          purchasedDate: new Date(now.getTime() + 500),
        }),
      );
      expect(equality).toBeTruthy();
    });

    it('Date equality is false when fields are different, and not within acceptable difference', () => {
      const now = new Date();
      const equality = new FieldEqualityManager<InvoiceEntity>(
        'purchasedDate',
      ).areFieldsEqual(
        EntityStubs.buildStubInvoice({
          purchasedDate: now,
        }),
        EntityStubs.buildStubInvoice({
          purchasedDate: new Date(now.getTime() + 70000),
        }),
      );
      expect(equality).toBeFalsy();
    });
  });
});
