import { mockMikroORMProvider, mockToken } from '@core/test';
import { CommandRunner } from '@module-cqrs';
import { AssignInvoiceActivityRequest } from '@module-invoices/data';
import { NotificationsService } from '@module-notifications';
import { InvoiceRepository } from '@module-persistence';
import { EntityStubs } from '@module-persistence/test';
import { Test, TestingModule } from '@nestjs/testing';
import { buildStubInvoiceTaggedEvent } from '../../tests/events';
import { InvoiceTaggedNotifyClientEventHandler } from './invoice-tagged.notify-client.event-handler';

describe('InvoiceTaggedNotifyClientEventHandler', () => {
  let handler: InvoiceTaggedNotifyClientEventHandler;
  let invoiceRepository: InvoiceRepository;
  let notificationsService: NotificationsService;
  let commandRunner: CommandRunner;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InvoiceTaggedNotifyClientEventHandler, mockMikroORMProvider],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    handler = module.get(InvoiceTaggedNotifyClientEventHandler);
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
    it('should not notify client if notifyClient is false', async () => {
      const runSpy = jest.spyOn(commandRunner, 'run');
      const event = buildStubInvoiceTaggedEvent({
        request: new AssignInvoiceActivityRequest({ notifyClient: false }),
      });

      await handler.handle(event);

      expect(notificationsService.notifyClient).not.toHaveBeenCalled();
      expect(runSpy).toBeCalledTimes(0);
    });

    it('should notify client if notifyClient is true', async () => {
      const invoiceStub = EntityStubs.buildStubInvoice();
      jest
        .spyOn(invoiceRepository, 'getOneById')
        .mockResolvedValueOnce(invoiceStub);

      jest
        .spyOn(notificationsService, 'notifyClient')
        .mockResolvedValueOnce([EntityStubs.buildStubNotification()]);

      const event = buildStubInvoiceTaggedEvent({
        request: new AssignInvoiceActivityRequest({
          notifyClient: true,
          notificationMessage: 'test123',
        }),
      });

      await handler.handle(event);

      expect(notificationsService.notifyClient).toHaveBeenCalledTimes(1);
      expect(commandRunner.run).toBeCalledTimes(1);
    });
  });
});
