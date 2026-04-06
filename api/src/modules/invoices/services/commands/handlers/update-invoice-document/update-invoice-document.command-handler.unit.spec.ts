import { mockMikroORMProvider, mockToken } from '@core/test';
import {
  InvoiceDocumentType,
  RecordStatus,
} from '@module-persistence/entities';
import { InvoiceRepository } from '@module-persistence/repositories';
import { Test, TestingModule } from '@nestjs/testing';
import { InvoiceDocumentMapper } from '../../../../data';
import { UpdateInvoiceDocumentRequestBuilder } from '../../../../tests';
import { UpdateInvoiceDocumentCommand } from '../../update-invoice-document.command';
import { UpdateInvoiceDocumentCommandHandler } from './update-invoice-document.command-handler';
import { EntityStubs } from '@module-persistence/test';

const mockHashFile = () => {
  jest.mock('@core/services', () => ({
    hashFile: jest.fn().mockReturnValueOnce(''),
  }));
};

describe('UpdateInvoiceDocumentCommandHandler', () => {
  let mapper: InvoiceDocumentMapper;
  let invoiceRepository: InvoiceRepository;
  let handler: UpdateInvoiceDocumentCommandHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [mockMikroORMProvider, UpdateInvoiceDocumentCommandHandler],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    mapper = module.get(InvoiceDocumentMapper);
    invoiceRepository = module.get(InvoiceRepository);
    handler = module.get(UpdateInvoiceDocumentCommandHandler);
    mockHashFile();
  });

  it('Should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('Generated document is added as primary, and rest of generated documents are inactive', async () => {
    const invoice = EntityStubs.buildStubInvoice({
      documents: [
        EntityStubs.buildStubInvoiceDocument({
          type: InvoiceDocumentType.Generated,
          recordStatus: RecordStatus.Active,
        }),
      ],
    });
    jest.spyOn(invoiceRepository, 'getOneById').mockResolvedValueOnce(invoice);
    jest.spyOn(mapper, 'updateRequestToEntity').mockResolvedValueOnce(
      EntityStubs.buildStubInvoiceDocument({
        type: InvoiceDocumentType.Generated,
        recordStatus: RecordStatus.Active,
      }),
    );
    await handler.execute(
      new UpdateInvoiceDocumentCommand(
        '',
        UpdateInvoiceDocumentRequestBuilder.from({
          type: InvoiceDocumentType.Generated,
        }),
      ),
    );

    expect(invoice.documents.length).toBe(2);
  });
});
