import { ValidationError } from '@core/validation';
import { PurchaseInvoiceRequest } from '@module-invoices/data';
import { EntityStubs } from '@module-persistence/test';
import { buildStubBroker } from '@module-brokers/test';
import { buildStubClient } from '@module-clients/test';
import {
  ClientPaymentStatus,
  InvoiceStatus,
} from '@module-persistence/entities';
import Big from 'big.js';
import { PurchaseInvoiceValidator } from './purchase-invoice-validator';
import { WireAmountValidator } from './wire-amount.validator';
import { ExpediteConfigurer } from '@module-common';
import { Test, TestingModule } from '@nestjs/testing';
import { mockToken } from '@core/test';

describe('Wire amount validator', () => {
  let validator: PurchaseInvoiceValidator;
  let expediteConfigurer: ExpediteConfigurer;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WireAmountValidator],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    expediteConfigurer = module.get(ExpediteConfigurer);
    validator = new WireAmountValidator(expediteConfigurer);
    jest
      .spyOn(expediteConfigurer, 'expediteFee')
      .mockReturnValue(new Big(1800));
  });

  it('WIRE invoice under minimum amount gets rejected', async () => {
    const payload = new PurchaseInvoiceRequest();
    const entity = EntityStubs.buildStubInvoice({
      status: InvoiceStatus.UnderReview,
      accountsReceivableValue: new Big(1000),
      clientPaymentStatus: ClientPaymentStatus.NotApplicable,
      expedited: true,
    });

    expect(
      validator.validate({
        entity: entity,
        client: buildStubClient(),
        broker: buildStubBroker(),
        payload: payload,
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('WIRE invoice above minimum but with fees gets rejected', async () => {
    const payload = new PurchaseInvoiceRequest();
    const entity = EntityStubs.buildStubInvoice({
      status: InvoiceStatus.UnderReview,
      accountsReceivableValue: new Big(3000),
      reserveFee: new Big(1000),
      deduction: new Big(500),
      clientPaymentStatus: ClientPaymentStatus.NotApplicable,
      expedited: true,
    });

    expect(
      validator.validate({
        entity: entity,
        client: buildStubClient(),
        broker: buildStubBroker(),
        payload: payload,
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('ACH invoice under WIRE minimum amount does not get rejected', async () => {
    const payload = new PurchaseInvoiceRequest();
    const entity = EntityStubs.buildStubInvoice({
      status: InvoiceStatus.UnderReview,
      value: new Big(1000),
      clientPaymentStatus: ClientPaymentStatus.NotApplicable,
      expedited: false,
    });

    expect(
      validator.validate({
        entity: entity,
        client: buildStubClient(),
        broker: buildStubBroker(),
        payload: payload,
      }),
    ).resolves.not.toThrow(ValidationError);
  });
});
