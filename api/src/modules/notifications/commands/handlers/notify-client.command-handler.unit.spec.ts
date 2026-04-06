import { mockToken } from '@core/test';
import { createMock } from '@golevelup/ts-jest';
import {
  Client,
  ClientContact,
  ClientContactPhone,
  ClientContactType,
  PhoneType,
} from '@module-clients/data';
import { FeatureFlagResolver } from '@module-common';
import { EmailService } from '@module-email';
import { FIREBASE_SERVICE, FirebaseService } from '@module-firebase';
import { NotificationMedium, NotificationStatus } from '@module-persistence';
import {
  ClientFactoringConfigsRepository,
  FirebaseTokenRepository,
  NotificationRepository,
} from '@module-persistence/repositories';
import { EntityStubs } from '@module-persistence/test';
import { SmsService } from '@module-sms';
import { Test, TestingModule } from '@nestjs/testing';
import { buildStubClient } from '../../../clients/test';
import { NotifyClientCommand } from '../notify-client.command';
import { NotifyClientCommandHandler } from './notify-client.command-handler';

describe('NotifyClientCommandHandler', () => {
  const notificationRepository = createMock<NotificationRepository>();
  const smsService = createMock<SmsService>();
  const emailService = createMock<EmailService>();
  const clientFactoringConfigsRepository =
    createMock<ClientFactoringConfigsRepository>();
  const firebaseTokenRepository = createMock<FirebaseTokenRepository>();
  const firebaseService = createMock<FirebaseService>();
  let handler: NotifyClientCommandHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotifyClientCommandHandler,
        NotificationRepository,
        SmsService,
        EmailService,
        ClientFactoringConfigsRepository,
        FirebaseTokenRepository,
        FeatureFlagResolver,
        { provide: FIREBASE_SERVICE, useValue: firebaseService },
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .overrideProvider(NotificationRepository)
      .useValue(notificationRepository)
      .overrideProvider(SmsService)
      .useValue(smsService)
      .overrideProvider(EmailService)
      .useValue(emailService)
      .overrideProvider(ClientFactoringConfigsRepository)
      .useValue(clientFactoringConfigsRepository)
      .overrideProvider(FirebaseTokenRepository)
      .useValue(firebaseTokenRepository)
      .overrideProvider(FeatureFlagResolver)
      .useValue({
        isEnabled: jest.fn().mockReturnValue(true),
      })
      .compile();

    handler = module.get(NotifyClientCommandHandler);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const subject = 'Test Subject';
    const body = 'Test notification message';

    it('should send all notification types when client has all contact methods', async () => {
      const client: Client = buildStubClient();
      const clientContact = new ClientContact({
        type: ClientContactType.BUSINESS,
        contactPhones: [
          new ClientContactPhone({
            phone: '+1234567890',
            phoneType: PhoneType.MOBILE,
          }),
        ],
      });
      client.clientContacts = [clientContact];

      const clientFactoringConfig = EntityStubs.buildClientFactoringConfig();
      const firebaseTokens = [
        EntityStubs.buildStubFirebaseToken({ token: 'token1' }),
        EntityStubs.buildStubFirebaseToken({ token: 'token2' }),
      ];

      clientFactoringConfigsRepository.getOneByClientId.mockResolvedValueOnce(
        clientFactoringConfig,
      );
      firebaseTokenRepository.findTokensByUserId.mockResolvedValueOnce(
        firebaseTokens,
      );
      smsService.sendSms.mockResolvedValueOnce({
        dateSent: new Date(),
        sid: 'sid',
        to: 'to',
        from: 'from',
      });
      emailService.send.mockResolvedValueOnce(null);
      firebaseService.sendPushNotification.mockResolvedValue(undefined);

      const command = new NotifyClientCommand(client, subject, body);
      const result = await handler.execute(command);

      expect(result).toHaveLength(3);
      expect(result.some((n) => n.medium === NotificationMedium.PUSH)).toBe(
        true,
      );
      expect(result.some((n) => n.medium === NotificationMedium.SMS)).toBe(
        true,
      );
      expect(result.some((n) => n.medium === NotificationMedium.EMAIL)).toBe(
        true,
      );
      expect(notificationRepository.persist).toHaveBeenCalledWith(result);
    });

    it('should skip SMS when client has no phone number', async () => {
      const client: Client = buildStubClient();
      client.clientContacts = [];

      const clientFactoringConfig = EntityStubs.buildClientFactoringConfig();
      const firebaseTokens = [EntityStubs.buildStubFirebaseToken()];

      clientFactoringConfigsRepository.getOneByClientId.mockResolvedValueOnce(
        clientFactoringConfig,
      );
      firebaseTokenRepository.findTokensByUserId.mockResolvedValueOnce(
        firebaseTokens,
      );
      emailService.send.mockResolvedValueOnce(null);
      firebaseService.sendPushNotification.mockResolvedValue(undefined);

      const command = new NotifyClientCommand(client, subject, body);
      const result = await handler.execute(command);

      expect(result).toHaveLength(2);
      expect(result.some((n) => n.medium === NotificationMedium.PUSH)).toBe(
        true,
      );
      expect(result.some((n) => n.medium === NotificationMedium.SMS)).toBe(
        false,
      );
      expect(result.some((n) => n.medium === NotificationMedium.EMAIL)).toBe(
        true,
      );
      expect(smsService.sendSms).not.toHaveBeenCalled();
    });

    it('should skip push notification when no firebase tokens found', async () => {
      const client = buildStubClient();
      const businessContact = new ClientContact({
        type: ClientContactType.BUSINESS,
        contactPhones: [
          new ClientContactPhone({
            phone: '+1234567890',
            phoneType: PhoneType.MOBILE,
          }),
        ],
      });
      client.clientContacts = [businessContact];

      const clientFactoringConfig = EntityStubs.buildClientFactoringConfig();

      clientFactoringConfigsRepository.getOneByClientId.mockResolvedValueOnce(
        clientFactoringConfig,
      );
      firebaseTokenRepository.findTokensByUserId.mockResolvedValueOnce([]);
      smsService.sendSms.mockResolvedValueOnce({
        dateSent: new Date(),
        sid: 'sid',
        to: 'to',
        from: 'from',
      });
      emailService.send.mockResolvedValueOnce(null);

      const command = new NotifyClientCommand(client, subject, body);
      const result = await handler.execute(command);

      expect(result).toHaveLength(2);
      expect(result.some((n) => n.medium === NotificationMedium.PUSH)).toBe(
        false,
      );
      expect(result.some((n) => n.medium === NotificationMedium.SMS)).toBe(
        true,
      );
      expect(result.some((n) => n.medium === NotificationMedium.EMAIL)).toBe(
        true,
      );
      expect(firebaseService.sendPushNotification).not.toHaveBeenCalled();
    });

    it('should handle SMS failure gracefully', async () => {
      const client = buildStubClient();
      const businessContact = new ClientContact({
        type: ClientContactType.BUSINESS,
        contactPhones: [
          new ClientContactPhone({
            phone: '+1234567890',
            phoneType: PhoneType.MOBILE,
          }),
        ],
      });
      client.clientContacts = [businessContact];

      const clientFactoringConfig = EntityStubs.buildClientFactoringConfig();
      const firebaseTokens = [EntityStubs.buildStubFirebaseToken()];

      clientFactoringConfigsRepository.getOneByClientId.mockResolvedValueOnce(
        clientFactoringConfig,
      );
      firebaseTokenRepository.findTokensByUserId.mockResolvedValueOnce(
        firebaseTokens,
      );
      smsService.sendSms.mockRejectedValueOnce(new Error('SMS failed'));
      emailService.send.mockResolvedValueOnce(null);
      firebaseService.sendPushNotification.mockResolvedValue(undefined);

      const command = new NotifyClientCommand(client, subject, body);
      const result = await handler.execute(command);

      const smsNotification = result.find(
        (n) => n.medium === NotificationMedium.SMS,
      );
      expect(smsNotification?.status).toBe(NotificationStatus.FAILED);
      expect(result).toHaveLength(3);
    });

    it('should handle email failure gracefully', async () => {
      const client = buildStubClient();
      const businessContact = new ClientContact({
        type: ClientContactType.BUSINESS,
        contactPhones: [
          new ClientContactPhone({
            phone: '+1234567890',
            phoneType: PhoneType.MOBILE,
          }),
        ],
      });
      client.clientContacts = [businessContact];

      const clientFactoringConfig = EntityStubs.buildClientFactoringConfig();
      const firebaseTokens = [EntityStubs.buildStubFirebaseToken()];

      clientFactoringConfigsRepository.getOneByClientId.mockResolvedValueOnce(
        clientFactoringConfig,
      );
      firebaseTokenRepository.findTokensByUserId.mockResolvedValueOnce(
        firebaseTokens,
      );
      smsService.sendSms.mockResolvedValueOnce({
        dateSent: new Date(),
        sid: 'sid',
        to: 'to',
        from: 'from',
      });
      emailService.send.mockRejectedValueOnce(new Error('Email failed'));
      firebaseService.sendPushNotification.mockResolvedValue(undefined);

      const command = new NotifyClientCommand(client, subject, body);
      const result = await handler.execute(command);

      const emailNotification = result.find(
        (n) => n.medium === NotificationMedium.EMAIL,
      );
      expect(emailNotification?.status).toBe(NotificationStatus.FAILED);
      expect(result).toHaveLength(3);
    });

    it('should handle push notification failure gracefully', async () => {
      const client = buildStubClient();
      const businessContact = new ClientContact({
        type: ClientContactType.BUSINESS,
        contactPhones: [
          new ClientContactPhone({
            phone: '+1234567890',
            phoneType: PhoneType.MOBILE,
          }),
        ],
      });
      client.clientContacts = [businessContact];

      const clientFactoringConfig = EntityStubs.buildClientFactoringConfig();
      const firebaseTokens = [EntityStubs.buildStubFirebaseToken()];

      clientFactoringConfigsRepository.getOneByClientId.mockResolvedValueOnce(
        clientFactoringConfig,
      );
      firebaseTokenRepository.findTokensByUserId.mockResolvedValueOnce(
        firebaseTokens,
      );
      smsService.sendSms.mockResolvedValueOnce({
        dateSent: new Date(),
        sid: 'sid',
        to: 'to',
        from: 'from',
      });
      emailService.send.mockResolvedValueOnce(null);
      firebaseService.sendPushNotification.mockRejectedValueOnce(
        new Error('Push failed'),
      );

      const command = new NotifyClientCommand(client, subject, body);
      const result = await handler.execute(command);

      const pushNotification = result.find(
        (n) => n.medium === NotificationMedium.PUSH,
      );
      expect(pushNotification?.status).toBe(NotificationStatus.FAILED);
      expect(result).toHaveLength(3);
    });
  });
});
