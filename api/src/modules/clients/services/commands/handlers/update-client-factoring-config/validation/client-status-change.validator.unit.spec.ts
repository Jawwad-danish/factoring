import { mockToken } from '@core/test';
import { ValidationError } from '@core/validation';
import { EntityStubs } from '@module-persistence/test';
import {
  InvoiceRepository,
  ReserveRepository,
} from '@module-persistence/repositories';
import { ClientFactoringStatus } from '@module-persistence/entities';
import { Test, TestingModule } from '@nestjs/testing';
import { ClientFactoringConfigRequestBuilder } from '../../../../../test';
import { ClientStatusChangeValidator } from './client-status-change.validator';

describe('Client status change validator', () => {
  let validator: ClientStatusChangeValidator;
  let invoiceRepository: InvoiceRepository;
  let reserveRepository: ReserveRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClientStatusChangeValidator],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    validator = module.get(ClientStatusChangeValidator);
    invoiceRepository = module.get(InvoiceRepository);
    reserveRepository = module.get(ReserveRepository);
  });

  it('Should be defined', () => {
    expect(validator).toBeDefined();
  });

  it('Throws error when trying to update status to Released with approved invoices', async () => {
    jest
      .spyOn(invoiceRepository, 'getClientInvoiceUnderApprovedStatus')
      .mockResolvedValueOnce(EntityStubs.buildStubInvoice());

    await expect(
      validator.validate([
        ClientFactoringConfigRequestBuilder.from({
          status: ClientFactoringStatus.Released,
        }),
        EntityStubs.buildClientFactoringConfig(),
      ]),
    ).rejects.toThrow(ValidationError);
  });

  it('Throws error when trying to update status with negative balance', async () => {
    jest
      .spyOn(reserveRepository, 'getTotalByClient')
      .mockResolvedValueOnce(-100);

    await expect(
      validator.validate([
        ClientFactoringConfigRequestBuilder.from({
          status: ClientFactoringStatus.Released,
        }),
        EntityStubs.buildClientFactoringConfig(),
      ]),
    ).rejects.toThrow(ValidationError);
  });
});
