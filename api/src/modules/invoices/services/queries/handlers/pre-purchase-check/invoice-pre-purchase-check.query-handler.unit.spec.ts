import { mockMikroORMProvider, mockToken } from '@core/test';
import { createMock } from '@golevelup/ts-jest';
import { ClientService } from '@module-clients';
import { buildStubClient } from '@module-clients/test';
import {
  PrePurchaseCheckCode,
  PrePurchaseCheckResult,
  PurchaseInvoiceRequest,
} from '@module-invoices/data';
import { EntityStubs } from '@module-persistence/test';
import { InvoiceRepository } from '@module-persistence';
import { Test, TestingModule } from '@nestjs/testing';
import { UUID } from '@core/uuid';
import { PrePurchaseCheckEngine } from '../../../engines';
import { InvoicePrePurchaseCheckQuery } from '../../../queries';
import { InvoicePrePurchaseCheckQueryHandler } from './invoice-pre-purchase-check.query-handler';

describe('InvoicePrePurchaseCheckQueryHandler', () => {
  let handler: InvoicePrePurchaseCheckQueryHandler;
  const prePurchaseCheckEngine = createMock<PrePurchaseCheckEngine>();
  const clientService = createMock<ClientService>();
  const invoiceRepository = createMock<InvoiceRepository>();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        mockMikroORMProvider,
        InvoicePrePurchaseCheckQueryHandler,
        { provide: PrePurchaseCheckEngine, useValue: prePurchaseCheckEngine },
        { provide: ClientService, useValue: clientService },
        { provide: InvoiceRepository, useValue: invoiceRepository },
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    handler = module.get(InvoicePrePurchaseCheckQueryHandler);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    const invoiceId = UUID.get();
    const clientId = UUID.get();
    let query: InvoicePrePurchaseCheckQuery;
    let invoice: any;
    let client: any;

    beforeEach(() => {
      query = new InvoicePrePurchaseCheckQuery(
        invoiceId,
        new PurchaseInvoiceRequest(),
      );
      invoice = EntityStubs.buildStubInvoice({ id: invoiceId, clientId });
      client = buildStubClient({ id: clientId });

      jest.spyOn(invoiceRepository, 'getOneById').mockResolvedValue(invoice);
      jest.spyOn(clientService, 'getOneById').mockResolvedValue(client);
    });

    it('should return successful check result when no warnings are present', async () => {
      jest.spyOn(prePurchaseCheckEngine, 'run').mockResolvedValue([]);

      const result = await handler.execute(query);

      expect(invoiceRepository.getOneById).toHaveBeenCalledWith(invoiceId);
      expect(clientService.getOneById).toHaveBeenCalledWith(clientId);
      expect(prePurchaseCheckEngine.run).toHaveBeenCalledWith({
        payload: query.request,
        client,
        invoice,
      });
      expect(result).toEqual({
        requiresAttention: false,
        warnings: [],
        message: 'This invoice can be safely purchased.',
      });
    });

    it('should return check result with warnings when check engine returns warnings', async () => {
      const warnings: PrePurchaseCheckResult[] = [
        {
          code: PrePurchaseCheckCode.ClientLimitExceeded,
          note: 'Client limit exceeded',
          details: {
            cause: 'Client limit exceeded',
            clientLimit: '5000',
            newTotal: '6000',
          },
        },
      ];

      jest.spyOn(prePurchaseCheckEngine, 'run').mockResolvedValue(warnings);

      const result = await handler.execute(query);

      expect(invoiceRepository.getOneById).toHaveBeenCalledWith(invoiceId);
      expect(clientService.getOneById).toHaveBeenCalledWith(clientId);
      expect(prePurchaseCheckEngine.run).toHaveBeenCalledWith({
        payload: query.request,
        client,
        invoice,
      });
      expect(result).toEqual({
        requiresAttention: true,
        warnings,
        message: 'This invoice may require changes before purchase.',
      });
    });
  });
});
