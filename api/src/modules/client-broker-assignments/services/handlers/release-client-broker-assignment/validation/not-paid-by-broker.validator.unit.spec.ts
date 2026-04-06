import { mockToken } from '@core/test';
import { ValidationError } from '@core/validation';
import { InvoiceRepository } from '@module-persistence/repositories';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityStubs } from '@module-persistence/test';
import { NotPaidByBrokerValidator } from './not-paid-by-broker.validator';

describe('Not paid by broker validator', () => {
  let validator: NotPaidByBrokerValidator;
  let invoiceRepository: InvoiceRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotPaidByBrokerValidator],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    validator = module.get(NotPaidByBrokerValidator);
    invoiceRepository = module.get(InvoiceRepository);
  });

  it('Rule should be defined', () => {
    expect(validator).toBeDefined();
  });

  it('Throws error if purchased and not paid to client invoices are found', async () => {
    jest.spyOn(invoiceRepository, 'count').mockResolvedValueOnce(1);
    expect(
      validator.validate(EntityStubs.buildClientBrokerAssignment()),
    ).rejects.toThrow(ValidationError);
  });

  it('Does not throws errors if purchased and not paid to client invoices are not found', async () => {
    jest.spyOn(invoiceRepository, 'count').mockResolvedValueOnce(0);
    expect(
      validator.validate(EntityStubs.buildClientBrokerAssignment()),
    ).resolves.not.toThrow();
  });
});
