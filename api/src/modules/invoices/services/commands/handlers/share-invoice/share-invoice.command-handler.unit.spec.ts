import { mockToken } from '@core/test';
import { ValidationError } from '@core/validation';
import { ClientApi } from '@module-clients';
import { buildStubClient } from '@module-clients/test';
import { InvoiceShareEmail } from '@module-email';
import {
  EntityStubs,
  InvoiceRepository,
  InvoiceStatus,
} from '@module-persistence';
import { Test, TestingModule } from '@nestjs/testing';
import { ShareInvoiceRequest } from '../../../../data';
import { ShareInvoiceCommand } from '../../share-invoice.command';
import { ShareInvoiceCommandHandler } from './share-invoice.command-handler';

describe('ShareInvoiceCommandHandler', () => {
  let handler: ShareInvoiceCommandHandler;
  let invoiceRepository: InvoiceRepository;
  let clientApi: ClientApi;
  let invoiceShareEmail: InvoiceShareEmail;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ShareInvoiceCommandHandler],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();
    handler = module.get(ShareInvoiceCommandHandler);
    invoiceRepository = module.get(InvoiceRepository);
    clientApi = module.get(ClientApi);
    invoiceShareEmail = module.get(InvoiceShareEmail);
  }, 60000);

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should fail if invoice is under review', async () => {
    jest.spyOn(invoiceRepository, 'getOneById').mockResolvedValue(
      EntityStubs.buildStubInvoice({
        status: InvoiceStatus.UnderReview,
      }),
    );
    jest.spyOn(clientApi, 'getById').mockResolvedValueOnce(buildStubClient());

    expect(
      handler.execute(
        new ShareInvoiceCommand(
          '1',
          new ShareInvoiceRequest({ emails: ['test'] }),
        ),
      ),
    ).rejects.toThrowError(ValidationError);
    expect(clientApi.getById).toHaveBeenCalledTimes(0);
  });

  it('should send email when conditions are met', async () => {
    jest.spyOn(invoiceRepository, 'getOneById').mockResolvedValue(
      EntityStubs.buildStubInvoice({
        status: InvoiceStatus.Purchased,
      }),
    );
    jest.spyOn(clientApi, 'getById').mockResolvedValueOnce(buildStubClient());

    await handler.execute(
      new ShareInvoiceCommand(
        '1',
        new ShareInvoiceRequest({ emails: ['test'] }),
      ),
    );
    expect(invoiceShareEmail.send).toHaveBeenCalledTimes(1);
  });
});
