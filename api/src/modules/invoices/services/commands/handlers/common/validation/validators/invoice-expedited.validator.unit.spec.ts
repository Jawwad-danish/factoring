import { mockToken } from '@core/test';
import { UUID } from '@core/uuid';
import { ValidationError } from '@core/validation';
import { CreateInvoiceRequest } from '@fs-bobtail/factoring/data';
import { buildStubClient } from '@module-clients/test';
import { ExpediteConfigurer } from '@module-common';
import { buildStubCreateInvoiceRequest } from '@module-invoices/test';
import { EntityStubs } from '@module-persistence/test';
import { Test, TestingModule } from '@nestjs/testing';
import Big from 'big.js';
import { InvoiceExpeditedValidator } from './invoice-expedited.validator';

describe('Create existing invoice validator', () => {
  let validator: InvoiceExpeditedValidator<CreateInvoiceRequest>;
  let expediteConfigurer: ExpediteConfigurer;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InvoiceExpeditedValidator],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    validator = module.get(InvoiceExpeditedValidator);
    expediteConfigurer = module.get(ExpediteConfigurer);
    jest
      .spyOn(expediteConfigurer, 'expediteFee')
      .mockReturnValue(new Big(1800));
  });

  it(`When request is expedited and client is expedited and value over or equal to $18, validation passes`, async () => {
    const clientEntity = buildStubClient();
    clientEntity.factoringConfig.expediteTransferOnly = true;
    const requestEntity = buildStubCreateInvoiceRequest({
      id: UUID.get(),
    });
    requestEntity.lineHaulRate = new Big(1800);
    requestEntity.expedited = true;
    expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice(),
        client: clientEntity,
        broker: null,
        payload: requestEntity,
      }),
    ).resolves.not.toThrow();
  });

  it(`When request is expedited and client is ach and value over or equal to $18, validation passes`, async () => {
    const clientEntity = buildStubClient();
    clientEntity.factoringConfig.expediteTransferOnly = false;
    const requestEntity = buildStubCreateInvoiceRequest({
      id: UUID.get(),
    });
    requestEntity.lineHaulRate = new Big(1800);
    requestEntity.expedited = true;
    expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice(),
        client: clientEntity,
        broker: null,
        payload: requestEntity,
      }),
    ).resolves.not.toThrow();
  });

  it(`When request is ach and client is ach and value over or equal to $18, validation passes`, async () => {
    const clientEntity = buildStubClient();
    clientEntity.factoringConfig.expediteTransferOnly = false;
    const requestEntity = buildStubCreateInvoiceRequest({
      id: UUID.get(),
    });
    requestEntity.lineHaulRate = new Big(1800);
    requestEntity.expedited = false;
    expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice(),
        client: clientEntity,
        broker: null,
        payload: requestEntity,
      }),
    ).resolves.not.toThrow();
  });

  it(`When request is ach and client is expedited and value over or equal to $18, validation passes`, async () => {
    const clientEntity = buildStubClient();
    clientEntity.factoringConfig.expediteTransferOnly = true;
    const requestEntity = buildStubCreateInvoiceRequest({
      id: UUID.get(),
    });
    requestEntity.lineHaulRate = new Big(1800);
    requestEntity.expedited = false;
    expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice(),
        client: clientEntity,
        broker: null,
        payload: requestEntity,
      }),
    ).resolves.not.toThrow();
  });

  it(`When request is expedited and client is expedited and value under $18, validation throws`, async () => {
    const clientEntity = buildStubClient();
    clientEntity.factoringConfig.expediteTransferOnly = true;
    const requestEntity = buildStubCreateInvoiceRequest({
      id: UUID.get(),
    });
    requestEntity.lineHaulRate = new Big(17.99);
    requestEntity.expedited = true;
    expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice(),
        client: clientEntity,
        broker: null,
        payload: requestEntity,
      }),
    ).rejects.toThrow(ValidationError);
  });

  it(`When request is expedited and client is ach and value under $18, validation throws`, async () => {
    const clientEntity = buildStubClient();
    clientEntity.factoringConfig.expediteTransferOnly = false;
    const requestEntity = buildStubCreateInvoiceRequest({
      id: UUID.get(),
    });
    requestEntity.lineHaulRate = new Big(17.99);
    requestEntity.expedited = true;
    expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice(),
        client: clientEntity,
        broker: null,
        payload: requestEntity,
      }),
    ).rejects.toThrow(ValidationError);
  });

  it(`When request is ach and client is ach and existing invoice is ach and value under $18, validation passes`, async () => {
    const clientEntity = buildStubClient();
    clientEntity.factoringConfig.expediteTransferOnly = false;
    const requestEntity = buildStubCreateInvoiceRequest({
      id: UUID.get(),
    });
    requestEntity.lineHaulRate = new Big(1799);
    requestEntity.expedited = false;
    expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice(),
        client: clientEntity,
        broker: null,
        payload: requestEntity,
      }),
    ).resolves.not.toThrow();
  });

  it(`When request is ach and client is expedited and value under $18, validation throws`, async () => {
    const clientEntity = buildStubClient();
    clientEntity.factoringConfig.expediteTransferOnly = true;
    const requestEntity = buildStubCreateInvoiceRequest({
      id: UUID.get(),
    });
    requestEntity.lineHaulRate = new Big(17.99);
    requestEntity.expedited = false;
    expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice(),
        client: clientEntity,
        broker: null,
        payload: requestEntity,
      }),
    ).rejects.toThrow(ValidationError);
  });
});
