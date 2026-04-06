import { mockMikroORMProvider, mockToken } from '@core/test';
import { Test, TestingModule } from '@nestjs/testing';
import { SendPurchaseEmailEventHandler } from './send-purchase-email.event-handler';
import { BrokerService } from '@module-brokers';
import { EmailProcessInput, InvoicePurchaseEmail } from '@module-email';
import { DatabaseService } from '@module-database';
import { SendPurchaseEmailEvent } from '@module-invoices/data';
import { EntityStubs } from '@module-persistence/test';
import { buildStubBroker } from '@module-brokers/test';
import { InvoiceRepository } from '@module-persistence';

describe('SendPurchaseEmailEventHandler', () => {
  let handler: SendPurchaseEmailEventHandler;
  let brokerService: BrokerService;
  let purchaseEmail: InvoicePurchaseEmail;
  let databaseService: DatabaseService;
  let invoiceRepository: InvoiceRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SendPurchaseEmailEventHandler, mockMikroORMProvider],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    handler = module.get<SendPurchaseEmailEventHandler>(
      SendPurchaseEmailEventHandler,
    );
    brokerService = module.get<BrokerService>(BrokerService);
    purchaseEmail = module.get<InvoicePurchaseEmail>(InvoicePurchaseEmail);
    invoiceRepository = module.get<InvoiceRepository>(InvoiceRepository);
    databaseService = module.get(DatabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('SendPurchaseEmailEventHandler should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('handle', () => {
    it('should not send a purchase email if the broker is missing from the invoice', async () => {
      const invoiceStub = EntityStubs.buildStubInvoice();
      jest
        .spyOn(databaseService, 'withRequestContext')
        .mockImplementation(async (callback) => {
          await callback();
        });

      jest.spyOn(handler, 'handle');
      jest
        .spyOn(invoiceRepository, 'getOneById')
        .mockResolvedValueOnce(invoiceStub);

      const event = new SendPurchaseEmailEvent(invoiceStub.id);

      await handler.handleSendPurchaseEmail(event);

      expect(handler.handle).toHaveBeenCalledWith(event);
      expect(purchaseEmail.send).toBeCalledTimes(0);
    });

    it('should not send a purchase email if the broker is missing with the invoice broker id', async () => {
      const invoiceStub = EntityStubs.buildStubInvoice();
      jest
        .spyOn(databaseService, 'withRequestContext')
        .mockImplementation(async (callback) => {
          await callback();
        });

      jest.spyOn(handler, 'handle');
      jest
        .spyOn(invoiceRepository, 'getOneById')
        .mockResolvedValueOnce(invoiceStub);

      const event = new SendPurchaseEmailEvent(invoiceStub.id);

      await handler.handleSendPurchaseEmail(event);

      expect(handler.handle).toHaveBeenCalledWith(event);
      expect(purchaseEmail.send).toBeCalledTimes(0);
    });

    it('should send a purchase email if the broker exists', async () => {
      const brokerStub = buildStubBroker();
      const invoiceStub = EntityStubs.buildStubInvoice();
      jest
        .spyOn(databaseService, 'withRequestContext')
        .mockImplementation(async (callback) => {
          await callback();
        });
      jest
        .spyOn(brokerService, 'findOneById')
        .mockResolvedValueOnce(brokerStub);
      jest.spyOn(handler, 'handle');
      jest
        .spyOn(invoiceRepository, 'getOneById')
        .mockResolvedValueOnce(invoiceStub);

      const purchasedEmailSpy = jest.spyOn(purchaseEmail, 'send');

      const event = new SendPurchaseEmailEvent(invoiceStub.id);

      await handler.handleSendPurchaseEmail(event);

      expect(handler.handle).toHaveBeenCalledWith(event);
      expect(purchasedEmailSpy).toHaveBeenCalledTimes(1);
      expect(purchasedEmailSpy).toHaveBeenCalledWith({
        broker: brokerStub,
        invoice: invoiceStub,
      } as EmailProcessInput);
    });
  });
});
