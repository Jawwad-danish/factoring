import { CommandRunner, EventPublisher } from '@module-cqrs';
import { DocumentOptions } from '@module-invoices/data';
import { UpdateInvoiceDocumentRequestBuilder } from '@module-invoices/test';
import { RecordStatus } from '@module-persistence/entities';
import { InvoiceDocumentRepository } from '@module-persistence/repositories';
import { Test, TestingModule } from '@nestjs/testing';
import { mockToken } from '../../../core/test';
import { InvoiceDocumentService } from './invoice-document.service';
import { EmailEvents } from '@common';
import { EntityStubs } from '@module-persistence/test';

describe('Invoice Documents Service', () => {
  let invoiceDocumentRepository: InvoiceDocumentRepository;
  let invoiceDocumentService: InvoiceDocumentService;
  let commandRunner: CommandRunner;
  let eventPublisher: EventPublisher;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InvoiceDocumentService],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    commandRunner = module.get(CommandRunner);
    invoiceDocumentService = module.get(InvoiceDocumentService);
    invoiceDocumentRepository = module.get(InvoiceDocumentRepository);
    eventPublisher = module.get(EventPublisher);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Should be defined', () => {
    expect(invoiceDocumentService).toBeDefined();
  });

  it('Email is sent if flag is true', async () => {
    const commandRunnerSpy = jest.spyOn(commandRunner, 'run');
    const eventPublisherSpy = jest.spyOn(eventPublisher, 'emit');
    commandRunnerSpy.mockResolvedValue([
      EntityStubs.buildStubInvoice(),
      EntityStubs.buildStubInvoiceDocument(),
    ]);

    await invoiceDocumentService.update(
      '',
      UpdateInvoiceDocumentRequestBuilder.from({
        options: new DocumentOptions({
          sendDocumentAfterProcessingFlag: true,
        }),
      }),
    );

    expect(eventPublisherSpy).toBeCalledTimes(1);
    expect(eventPublisherSpy).toBeCalledWith(
      EmailEvents.Purchase,
      expect.anything(),
    );
  });

  it('Delete is successful and returns correct flag', async () => {
    const invoiceDocument = EntityStubs.buildStubInvoiceDocument();
    jest
      .spyOn(invoiceDocumentRepository, 'getOneById')
      .mockResolvedValueOnce(invoiceDocument);
    const result = await invoiceDocumentService.delete('');

    expect(result).toBeTruthy();
    expect(invoiceDocument.recordStatus).toBe(RecordStatus.Inactive);
  });
});
