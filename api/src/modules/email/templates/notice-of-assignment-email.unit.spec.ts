import { mockMikroORMProvider, mockToken } from '@core/test';
import { ValidationError } from '@core/validation';
import { buildStubBroker } from '@module-brokers/test';
import { ClientDocument, ClientDocumentType } from '@module-clients/data';
import { buildStubClient } from '@module-clients/test';
import { FeatureFlagResolver } from '@module-common';
import { Test, TestingModule } from '@nestjs/testing';
import axios from 'axios';
import { BrokerEmail, BrokerEmailType } from '../../brokers';
import { EmailService } from '../services';
import { NoticeOfAssignmentEmail } from './notice-of-assignment-email';
jest.mock('axios');

describe('NoticeOfAssignmentEmail', () => {
  const mockedAxios = axios as jest.Mocked<typeof axios>;
  let noticeOfAssignmentEmail: NoticeOfAssignmentEmail;
  let emailService: EmailService;
  let featureFlagResolver: FeatureFlagResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [mockMikroORMProvider, NoticeOfAssignmentEmail],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();
    emailService = module.get(EmailService);
    featureFlagResolver = module.get(FeatureFlagResolver);
    noticeOfAssignmentEmail = module.get(NoticeOfAssignmentEmail);
  }, 60000);

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(noticeOfAssignmentEmail).toBeDefined();
  });

  it('should not send email if feature flag is disabled', async () => {
    jest.spyOn(featureFlagResolver, 'isDisabled').mockReturnValue(true);
    const client = buildStubClient();
    const broker = buildStubBroker({
      emails: [],
    });
    const sendSpy = jest.spyOn(emailService, 'sendTemplate');
    await noticeOfAssignmentEmail.send({ client, broker });
    expect(sendSpy).toHaveBeenCalledTimes(0);
  });

  it(`should throw error if no ${BrokerEmailType.NOA} emails are present`, async () => {
    jest.spyOn(featureFlagResolver, 'isDisabled').mockReturnValue(false);
    const client = buildStubClient();
    const broker = buildStubBroker({
      emails: [],
    });
    await expect(
      noticeOfAssignmentEmail.send({ client, broker }),
    ).rejects.toThrow(ValidationError);
  });

  it('should send email to the provided recipient when `to` is passed (without reading broker emails)', async () => {
    jest.spyOn(featureFlagResolver, 'isDisabled').mockReturnValue(false);
    const to = 'debtor@test.com';

    const client = buildStubClient({
      documents: [
        new ClientDocument({ type: ClientDocumentType.NOTICE_OF_ASSIGNMENT }),
      ],
    });
    const broker = buildStubBroker({
      emails: [],
    });

    mockedAxios.get.mockResolvedValue({
      data: [],
    });

    const sendSpy = jest.spyOn(emailService, 'sendTemplate');
    await noticeOfAssignmentEmail.send({ client, broker, to });

    expect(sendSpy).toHaveBeenCalledTimes(1);
    const sendArgs = sendSpy.mock.calls[0][0];
    expect(sendArgs).toEqual(
      expect.objectContaining({
        destination: expect.objectContaining({
          to: [to],
        }),
      }),
    );
  });

  it(`should throw error if no NOA documents are present on the client`, async () => {
    jest.spyOn(featureFlagResolver, 'isDisabled').mockReturnValue(false);
    const client = buildStubClient({
      documents: [],
    });
    const broker = buildStubBroker({
      emails: [new BrokerEmail({ type: BrokerEmailType.NOA })],
    });
    await expect(
      noticeOfAssignmentEmail.send({ client, broker }),
    ).rejects.toThrow(ValidationError);
  });

  it(`should send email when all conditions are met`, async () => {
    jest.spyOn(featureFlagResolver, 'isDisabled').mockReturnValue(false);
    const client = buildStubClient({
      documents: [
        new ClientDocument({ type: ClientDocumentType.NOTICE_OF_ASSIGNMENT }),
      ],
    });
    const broker = buildStubBroker({
      emails: [new BrokerEmail({ type: BrokerEmailType.NOA })],
    });
    mockedAxios.get.mockResolvedValue({
      data: [],
    });

    const sendSpy = jest.spyOn(emailService, 'sendTemplate');
    await noticeOfAssignmentEmail.send({ client, broker });
    expect(sendSpy).toHaveBeenCalledTimes(1);
  });
});
