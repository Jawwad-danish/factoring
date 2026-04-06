import { mockMikroORMProvider, mockToken } from '@core/test';
import {
  InvoiceRepository,
  PeruseRepository,
} from '@module-persistence/repositories';
import { Test, TestingModule } from '@nestjs/testing';
import { InvoiceDocumentType } from '@module-persistence/entities';
import { PeruseClient } from '../peruse-client';
import { PeruseClassifyDocumentsOnInvoiceCreateEventHandler } from './peruse-classify-documents.invoice-create.event-handler';
import { PeruseJobResponse } from '../../data';
import { EntityStubs } from '@module-persistence/test';

describe('PeruseClassifyDocumentsOnInvoiceCreateEventHandler', () => {
  let handler: PeruseClassifyDocumentsOnInvoiceCreateEventHandler;
  let invoiceRepository: InvoiceRepository;
  let peruseRepository: PeruseRepository;
  let peruseClient: PeruseClient;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        mockMikroORMProvider,
        PeruseClassifyDocumentsOnInvoiceCreateEventHandler,
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    handler = module.get(PeruseClassifyDocumentsOnInvoiceCreateEventHandler);
    invoiceRepository = module.get(InvoiceRepository);
    peruseRepository = module.get(PeruseRepository);
    peruseClient = module.get(PeruseClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Should be defined', () => {
    expect(handler).toBeDefined();
    expect(invoiceRepository).toBeDefined();
    expect(peruseRepository).toBeDefined();
    expect(peruseClient).toBeDefined();
  });

  it('Peruse job is saved for processing', async () => {
    jest.spyOn(invoiceRepository, 'count').mockResolvedValueOnce(12);
    jest.spyOn(invoiceRepository, 'getOneById').mockResolvedValueOnce(
      EntityStubs.buildStubInvoice({
        documents: [
          EntityStubs.buildStubInvoiceDocument({
            type: InvoiceDocumentType.Uploaded,
          }),
        ],
      }),
    );
    jest.spyOn(peruseClient, 'bulkClassifyDocuments').mockResolvedValueOnce(
      new PeruseJobResponse({
        jobId: 'job-id',
      }),
    );
    const perusePersistSpy = jest.spyOn(peruseRepository, 'persist');

    await handler.doHandle('');
    expect(perusePersistSpy).toBeCalledTimes(1);
  });

  it('Peruse job is not saved', async () => {
    jest.spyOn(invoiceRepository, 'count').mockResolvedValueOnce(5);
    const perusePersistSpy = jest.spyOn(peruseRepository, 'persist');

    await handler.doHandle('');
    expect(perusePersistSpy).toBeCalledTimes(0);
  });
});
