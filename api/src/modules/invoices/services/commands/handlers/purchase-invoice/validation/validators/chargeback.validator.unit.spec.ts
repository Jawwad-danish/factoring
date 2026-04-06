import { mockToken } from '@core/test';
import { ValidationError } from '@core/validation';
import { buildStubBroker } from '@module-brokers/test';
import { buildStubClient } from '@module-clients/test';
import { PurchaseInvoiceRequest } from '@module-invoices/data';
import { ReserveRepository } from '@module-persistence/repositories';
import { EntityStubs } from '@module-persistence/test';
import { Test, TestingModule } from '@nestjs/testing';
import Big from 'big.js';
import { ChargebackValidator } from './chargeback.validator';

describe('ChargebackValidator', () => {
  let validator: ChargebackValidator;
  let reservesRepository: ReserveRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChargebackValidator],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    validator = module.get(ChargebackValidator);
    reservesRepository = module.get(ReserveRepository);
  });

  it('rejects when client reserve balance is positive and a chargeback is applied', async () => {
    jest
      .spyOn(reservesRepository, 'getTotalByClient')
      .mockResolvedValueOnce(100);
    expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice(),
        client: buildStubClient(),
        broker: buildStubBroker(),
        payload: new PurchaseInvoiceRequest({ deduction: new Big(100) }),
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('rejects when client reserve balance is 0 and a chargeback is applied', async () => {
    jest.spyOn(reservesRepository, 'getTotalByClient').mockResolvedValueOnce(0);
    expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice({
          accountsReceivableValue: new Big(150),
        }),
        client: buildStubClient(),
        broker: buildStubBroker(),
        payload: new PurchaseInvoiceRequest({ deduction: new Big(100) }),
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('rejects when deduction exceeds invoice value', async () => {
    expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice({
          accountsReceivableValue: new Big(100),
          reserveFee: new Big(10),
          approvedFactorFee: new Big(10),
        }),
        client: buildStubClient(),
        broker: buildStubBroker(),
        payload: new PurchaseInvoiceRequest({ deduction: new Big(130) }),
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('resolves when client reserve balance is negative and deduction is within available balance', async () => {
    jest
      .spyOn(reservesRepository, 'getTotalByClient')
      .mockResolvedValueOnce(-100);
    expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice({
          accountsReceivableValue: new Big(100),
          reserveFee: new Big(0),
          approvedFactorFee: new Big(0),
        }),
        client: buildStubClient(),
        broker: buildStubBroker(),
        payload: new PurchaseInvoiceRequest({ deduction: new Big(50) }),
      }),
    ).resolves.not.toThrow();
  });

  it('resolves when deduction is 0 (no chargeback)', async () => {
    expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice(),
        client: buildStubClient(),
        broker: buildStubBroker(),
        payload: new PurchaseInvoiceRequest({ deduction: new Big(0) }),
      }),
    ).resolves.not.toThrow();
  });

  it('rejects when deduction exceeds available negative reserve balance', async () => {
    jest
      .spyOn(reservesRepository, 'getTotalByClient')
      .mockResolvedValueOnce(-39);
    expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice({
          accountsReceivableValue: new Big(100),
          reserveFee: new Big(0),
          approvedFactorFee: new Big(0),
        }),
        client: buildStubClient(),
        broker: buildStubBroker(),
        payload: new PurchaseInvoiceRequest({ deduction: new Big(50) }),
      }),
    ).rejects.toThrow(ValidationError);
  });
});
