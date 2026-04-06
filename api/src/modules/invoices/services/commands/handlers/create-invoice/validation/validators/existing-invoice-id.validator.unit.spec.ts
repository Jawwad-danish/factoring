import { mockToken } from '@core/test';
import { ValidationError } from '@core/validation';
import { buildStubClient } from '@module-clients/test';
import { buildStubCreateInvoiceRequest } from '@module-invoices/test';
import { InvoiceRepository } from '@module-persistence/repositories';
import { Test, TestingModule } from '@nestjs/testing';
import { UUID } from '@core/uuid';
import { ExistingInvoiceIdValidator } from './existing-invoice-id.validator';
import { EntityStubs } from '@module-persistence/test';

describe('Create existing invoice validator', () => {
  let validator: ExistingInvoiceIdValidator;
  let invoiceRepository: InvoiceRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExistingInvoiceIdValidator],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    validator = module.get(ExistingInvoiceIdValidator);
    invoiceRepository = module.get(InvoiceRepository);
  });

  it('When no invoice id is in payload, validation passes', async () => {
    const anyMatchByIdSpy = jest.spyOn(invoiceRepository, 'anyMatchById');
    expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice(),
        client: buildStubClient(),
        broker: null,
        payload: buildStubCreateInvoiceRequest(),
      }),
    ).resolves.not.toThrow();
    expect(anyMatchByIdSpy).toBeCalledTimes(0);
  });

  it('When invoice id is in payload and does not exist, validation passes', async () => {
    jest.spyOn(invoiceRepository, 'anyMatchById').mockResolvedValue(false);
    expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice(),
        client: buildStubClient(),
        broker: null,
        payload: buildStubCreateInvoiceRequest({
          id: UUID.get(),
        }),
      }),
    ).resolves.not.toThrow();
  });

  it('When invoice id is in payload and invoice exists, validation throws error', async () => {
    jest.spyOn(invoiceRepository, 'anyMatchById').mockResolvedValue(true);
    expect(
      validator.validate({
        entity: EntityStubs.buildStubInvoice(),
        client: buildStubClient(),
        broker: null,
        payload: buildStubCreateInvoiceRequest({
          id: UUID.get(),
        }),
      }),
    ).rejects.toThrow(ValidationError);
  });
});
