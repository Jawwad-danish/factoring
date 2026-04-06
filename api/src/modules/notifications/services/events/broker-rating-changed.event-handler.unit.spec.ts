import { BrokerRatingChangedEvent } from '@common/events';
import { mockMikroORMProvider, mockToken } from '@core/test';
import { ClientApi, ClientContactType } from '@module-clients';
import { buildStubClient } from '@module-clients/test';
import { EmailService } from '@module-email';
import { InvoiceRepository } from '@module-persistence/repositories';
import { SmsService } from '@module-sms';
import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from '../notifications.service';
import { BrokerRatingChangedEventHandler } from './broker-rating-changed.event-handler';

describe('BrokerRatingChangedEventHandler', () => {
  let clientApi: ClientApi;
  let invoiceRepository: InvoiceRepository;
  let emailService: EmailService;
  let smsService: SmsService;
  let notificationsService: NotificationsService;
  let handler: BrokerRatingChangedEventHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BrokerRatingChangedEventHandler, mockMikroORMProvider],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    clientApi = module.get(ClientApi);
    invoiceRepository = module.get(InvoiceRepository);
    emailService = module.get(EmailService);
    smsService = module.get(SmsService);
    notificationsService = module.get(NotificationsService);
    handler = module.get(BrokerRatingChangedEventHandler);
  });

  const mockFindDistinctClientIds = (clientIds: string[]) => {
    jest
      .spyOn(invoiceRepository, 'findDistinctClientIdsByBroker')
      .mockResolvedValue(clientIds);
  };

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('handleBrokerRatingChanged', () => {
    const brokerId = 'broker-123';
    const brokerName = 'Test Broker LLC';
    const newRating = 'F';

    it('should send notifications to clients with recent invoices', async () => {
      const clientId = 'client-123';
      const client = buildStubClient({
        id: clientId,
        name: 'Test Client',
      });
      client.email = 'client@example.com';

      mockFindDistinctClientIds([clientId]);
      jest.spyOn(clientApi, 'findByIds').mockResolvedValue([client]);
      const notifyClientSpy = jest
        .spyOn(notificationsService, 'notifyClient')
        .mockResolvedValue([]);

      await handler.handleBrokerRatingChanged(
        new BrokerRatingChangedEvent(brokerId, brokerName, newRating),
      );

      expect(clientApi.findByIds).toHaveBeenCalledWith([clientId]);
      expect(notifyClientSpy).toHaveBeenCalledWith(
        client,
        'Important: Broker Rating Change Notification',
        expect.stringContaining(`Hello ${client.name}`),
      );
    });

    it('should not send notifications when no clients found', async () => {
      mockFindDistinctClientIds([]);
      const notifyClientSpy = jest.spyOn(notificationsService, 'notifyClient');

      await handler.handleBrokerRatingChanged(
        new BrokerRatingChangedEvent(brokerId, brokerName, newRating),
      );

      expect(clientApi.findByIds).not.toHaveBeenCalled();
      expect(notifyClientSpy).not.toHaveBeenCalled();
    });

    it('should send notifications to multiple clients', async () => {
      const client1 = buildStubClient({
        id: 'client-1',
        name: 'Client One',
      });
      client1.email = 'client1@example.com';
      const client2 = buildStubClient({
        id: 'client-2',
        name: 'Client Two',
      });
      client2.email = 'client2@example.com';

      mockFindDistinctClientIds(['client-1', 'client-2']);
      jest.spyOn(clientApi, 'findByIds').mockResolvedValue([client1, client2]);
      const notifyClientSpy = jest
        .spyOn(notificationsService, 'notifyClient')
        .mockResolvedValue([]);

      await handler.handleBrokerRatingChanged(
        new BrokerRatingChangedEvent(brokerId, brokerName, newRating),
      );

      expect(clientApi.findByIds).toHaveBeenCalledWith([
        'client-1',
        'client-2',
      ]);
      expect(notifyClientSpy).toHaveBeenCalledTimes(2);
    });

    it('should continue sending notifications even if one fails', async () => {
      const client = buildStubClient({
        id: 'client-123',
        name: 'Test Client',
      });
      client.email = 'client@example.com';

      mockFindDistinctClientIds(['client-123']);
      jest.spyOn(clientApi, 'findByIds').mockResolvedValue([client]);
      const notifyClientSpy = jest
        .spyOn(notificationsService, 'notifyClient')
        .mockRejectedValueOnce(new Error('Notification failed'));

      await expect(
        handler.handleBrokerRatingChanged(
          new BrokerRatingChangedEvent(brokerId, brokerName, newRating),
        ),
      ).resolves.not.toThrow();

      expect(notifyClientSpy).toHaveBeenCalledTimes(1);
    });

    it('should include broker name and rating in notification body', async () => {
      const client = buildStubClient({
        id: 'client-123',
        name: 'Test Client',
      });
      client.email = 'client@example.com';

      mockFindDistinctClientIds(['client-123']);
      jest.spyOn(clientApi, 'findByIds').mockResolvedValue([client]);
      const notifyClientSpy = jest
        .spyOn(notificationsService, 'notifyClient')
        .mockResolvedValue([]);

      await handler.handleBrokerRatingChanged(
        new BrokerRatingChangedEvent(brokerId, brokerName, newRating),
      );

      expect(notifyClientSpy).toHaveBeenCalledWith(
        client,
        expect.any(String),
        expect.stringContaining(brokerName),
      );
    });

    it('should send email and SMS to owner contacts', async () => {
      const ownerContact = {
        id: 'owner-1',
        type: ClientContactType.OWNER,
        email: 'owner@example.com',
        contactPhones: [{ phone: '+15551234567' }],
      } as any;
      const client = buildStubClient({
        id: 'client-123',
        name: 'Test Client',
      });
      client.clientContacts = [ownerContact];

      mockFindDistinctClientIds(['client-123']);
      jest.spyOn(clientApi, 'findByIds').mockResolvedValue([client]);
      jest.spyOn(notificationsService, 'notifyClient').mockResolvedValue([]);
      const emailSendSpy = jest
        .spyOn(emailService, 'send')
        .mockResolvedValue({} as any);
      const smsSendSpy = jest
        .spyOn(smsService, 'sendSms')
        .mockResolvedValue({} as any);

      await handler.handleBrokerRatingChanged(
        new BrokerRatingChangedEvent(brokerId, brokerName, newRating),
      );

      expect(emailSendSpy).toHaveBeenCalledWith({
        destination: { to: 'owner@example.com' },
        message: expect.objectContaining({
          subject: 'Important: Broker Rating Change Notification',
          body: expect.stringContaining('Test Broker LLC'),
        }),
      });
      expect(smsSendSpy).toHaveBeenCalledWith(
        '+15551234567',
        expect.stringContaining('Test Broker LLC'),
      );
    });

    it('should send notifications to multiple owner contacts', async () => {
      const ownerContacts = [
        {
          id: 'owner-1',
          type: ClientContactType.OWNER,
          email: 'owner1@example.com',
          contactPhones: [{ phone: '+15551111111' }],
        },
        {
          id: 'owner-2',
          type: ClientContactType.OWNER,
          email: 'owner2@example.com',
          contactPhones: [{ phone: '+15552222222' }],
        },
      ] as any;
      const client = buildStubClient({
        id: 'client-123',
        name: 'Test Client',
      });
      client.clientContacts = ownerContacts;

      mockFindDistinctClientIds(['client-123']);
      jest.spyOn(clientApi, 'findByIds').mockResolvedValue([client]);
      jest.spyOn(notificationsService, 'notifyClient').mockResolvedValue([]);
      const emailSendSpy = jest
        .spyOn(emailService, 'send')
        .mockResolvedValue({} as any);
      const smsSendSpy = jest
        .spyOn(smsService, 'sendSms')
        .mockResolvedValue({} as any);

      await handler.handleBrokerRatingChanged(
        new BrokerRatingChangedEvent(brokerId, brokerName, newRating),
      );

      expect(emailSendSpy).toHaveBeenCalledTimes(2);
      expect(smsSendSpy).toHaveBeenCalledTimes(2);
    });

    it('should skip owner email if no email exists', async () => {
      const ownerContact = {
        id: 'owner-1',
        type: ClientContactType.OWNER,
        email: null,
        contactPhones: [{ phone: '+15551234567' }],
      } as any;
      const client = buildStubClient({
        id: 'client-123',
        name: 'Test Client',
      });
      client.clientContacts = [ownerContact];

      mockFindDistinctClientIds(['client-123']);
      jest.spyOn(clientApi, 'findByIds').mockResolvedValue([client]);
      jest.spyOn(notificationsService, 'notifyClient').mockResolvedValue([]);
      const emailSendSpy = jest.spyOn(emailService, 'send');
      const smsSendSpy = jest
        .spyOn(smsService, 'sendSms')
        .mockResolvedValue({} as any);

      await handler.handleBrokerRatingChanged(
        new BrokerRatingChangedEvent(brokerId, brokerName, newRating),
      );

      expect(emailSendSpy).not.toHaveBeenCalled();
      expect(smsSendSpy).toHaveBeenCalledTimes(1);
    });

    it('should skip owner SMS if no phone exists', async () => {
      const ownerContact = {
        id: 'owner-1',
        type: ClientContactType.OWNER,
        email: 'owner@example.com',
        contactPhones: [],
      } as any;
      const client = buildStubClient({
        id: 'client-123',
        name: 'Test Client',
      });
      client.clientContacts = [ownerContact];

      mockFindDistinctClientIds(['client-123']);
      jest.spyOn(clientApi, 'findByIds').mockResolvedValue([client]);
      jest.spyOn(notificationsService, 'notifyClient').mockResolvedValue([]);
      const emailSendSpy = jest
        .spyOn(emailService, 'send')
        .mockResolvedValue({} as any);
      const smsSendSpy = jest.spyOn(smsService, 'sendSms');

      await handler.handleBrokerRatingChanged(
        new BrokerRatingChangedEvent(brokerId, brokerName, newRating),
      );

      expect(emailSendSpy).toHaveBeenCalledTimes(1);
      expect(smsSendSpy).not.toHaveBeenCalled();
    });
  });
});
