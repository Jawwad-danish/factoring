import { mockToken } from '@core/test';
import { BrokerService } from '@module-brokers';
import { buildStubBroker } from '@module-brokers/test';
import { ClientService } from '@module-clients';
import { buildStubClient } from '@module-clients/test';
import {
  RegenerateInvoiceDocumentRequestBuilder,
  builStubInvoice,
} from '@module-invoices/test';
import { InvoiceRepository } from '@module-persistence/repositories';
import { Test, TestingModule } from '@nestjs/testing';
import { InvoiceMapper } from '../../../../data';
import { DocumentsProcessor } from '../../../documents-processing.service';
import { RegenerateInvoiceDocumentCommand } from '../../regenerate-invoice-document.command';
import { RegenerateInvoiceDocumentCommandHandler } from './regenerate-invoice-document.command-handler';
import { EntityStubs } from '@module-persistence/test';

describe('RegenerateInvoiceDocumentCommandHandler', () => {
  let brokerService: BrokerService;
  let clientService: ClientService;
  let documentProcessor: DocumentsProcessor;
  let handler: RegenerateInvoiceDocumentCommandHandler;
  let invoiceRepository: InvoiceRepository;
  let mapper: InvoiceMapper;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RegenerateInvoiceDocumentCommandHandler],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    brokerService = module.get(BrokerService);
    clientService = module.get(ClientService);
    documentProcessor = module.get(DocumentsProcessor);
    handler = module.get(RegenerateInvoiceDocumentCommandHandler);
    invoiceRepository = module.get(ClientService);
    mapper = module.get(InvoiceMapper);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('Document processor is called', async () => {
    jest
      .spyOn(invoiceRepository, 'getOneById')
      .mockResolvedValueOnce(EntityStubs.buildStubInvoice());
    jest
      .spyOn(mapper, 'entityToModel')
      .mockResolvedValueOnce(builStubInvoice());
    jest
      .spyOn(clientService, 'getOneById')
      .mockResolvedValueOnce(buildStubClient());
    jest
      .spyOn(brokerService, 'findOneById')
      .mockResolvedValueOnce(buildStubBroker());

    await handler.execute(
      new RegenerateInvoiceDocumentCommand(
        '',
        RegenerateInvoiceDocumentRequestBuilder.from(),
      ),
    );

    expect(jest.spyOn(documentProcessor, 'sendToProcess')).toBeCalledTimes(1);

    expect(documentProcessor.sendToProcess).toBeCalledTimes(1);
  });
});
