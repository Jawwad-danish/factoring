import { mockMikroORMProvider, mockToken } from '@core/test';
import { CommandRunner } from '@module-cqrs';
import { RejectInvoiceRequest } from '@module-invoices/data';
import { buildStubInvoiceRejectedEvent } from '@module-invoices/test';
import { NotificationsService } from '@module-notifications';
import { InvoiceRepository } from '@module-persistence';
import { EntityStubs } from '@module-persistence/test';
import { Test, TestingModule } from '@nestjs/testing';
import { InvoiceRejectedNotifyClientEventHandler } from './invoice-rejected.notify-client.event-handler';

describe('InvoiceRejectedNotifyClientEventHandler', () => {
  let handler: InvoiceRejectedNotifyClientEventHandler;
  let invoiceRepository: InvoiceRepository;
  let notificationsService: NotificationsService;
  let commandRunner: CommandRunner;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoiceRejectedNotifyClientEventHandler,
        mockMikroORMProvider,
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    handler = module.get(InvoiceRejectedNotifyClientEventHandler);
    notificationsService = module.get(NotificationsService);
    invoiceRepository = module.get(InvoiceRepository);
    commandRunner = module.get(CommandRunner);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('handle', () => {
    it('should not notify client if notifyClient is false when rejecting an invoice', async () => {
      const runSpy = jest.spyOn(commandRunner, 'run');
      const event = buildStubInvoiceRejectedEvent({
        request: new RejectInvoiceRequest({ notifyClient: false }),
      });

      await handler.handle(event);

      expect(notificationsService.notifyClient).not.toHaveBeenCalled();
      expect(runSpy).toBeCalledTimes(0);
    });

    it('should not notify client if notificationMessage is empty/undefined when rejecting an invoice', async () => {
      const event = buildStubInvoiceRejectedEvent({
        request: new RejectInvoiceRequest({
          notifyClient: true,
          notificationMessage: '',
        }),
      });

      await handler.handle(event);

      expect(notificationsService.notifyClient).not.toHaveBeenCalledTimes(1);
      expect(commandRunner.run).toBeCalledTimes(0);
    });

    it('should notify client with rejection invoice message if notifyClient is true and notificationMessage exists', async () => {
      const invoiceStub = EntityStubs.buildStubInvoice();

      jest
        .spyOn(invoiceRepository, 'getOneById')
        .mockResolvedValue(invoiceStub);

      jest
        .spyOn(notificationsService, 'notifyClient')
        .mockResolvedValueOnce([EntityStubs.buildStubNotification()]);

      const event = buildStubInvoiceRejectedEvent({
        request: new RejectInvoiceRequest({
          notifyClient: true,
          notificationMessage: 'Rejected for duplication reasons',
        }),
      });

      await handler.handle(event);

      expect(notificationsService.notifyClient).toBeCalledTimes(1);
      expect(commandRunner.run).toBeCalledTimes(1);
    });
  });
});
