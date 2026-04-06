import { mockToken } from '@core/test';
import { InvoiceChangeActionsExecutor } from '@module-invoices-tag-activity';
import { InvoiceRepository } from '@module-persistence/repositories';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityStubs } from '@module-persistence/test';
import { FailInvoiceDocumentGenerationCommand } from '../../fail-invoice-document-generation.command';
import { FailInvoiceDocumentGenerationCommandHandler } from './fail-invoice-document-generation.command-handler';

describe('FailInvoiceDocumentGenerationCommandHandler', () => {
  let invoiceRepository: InvoiceRepository;
  let invoiceChangeActionsExecutor: InvoiceChangeActionsExecutor;
  let handler: FailInvoiceDocumentGenerationCommandHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FailInvoiceDocumentGenerationCommandHandler],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    invoiceChangeActionsExecutor = module.get(InvoiceChangeActionsExecutor);
    invoiceRepository = module.get(InvoiceRepository);
    handler = module.get(FailInvoiceDocumentGenerationCommandHandler);
  });

  it('Should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('Tag changes are applied to the invoice', async () => {
    const stubInvoice = EntityStubs.buildStubInvoice();
    jest
      .spyOn(invoiceRepository, 'getOneById')
      .mockResolvedValueOnce(stubInvoice);
    const applySpy = jest.spyOn(invoiceChangeActionsExecutor, 'apply');

    await handler.execute(new FailInvoiceDocumentGenerationCommand(''));

    const applyParams = applySpy.mock.calls[0];
    expect(applySpy).toBeCalledTimes(1);
    expect(applyParams[0].id).toBe(stubInvoice.id);
    expect(applyParams[1].isEmpty()).toBe(false);
  });
});
