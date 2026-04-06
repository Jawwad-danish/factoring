import { AppContextHolder } from '@core/app-context';
import { mockToken } from '@core/test';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { SQSService } from '@module-aws';
import { buildStubBroker } from '@module-brokers/test';
import { buildStubClient } from '@module-clients/test';
import { FeatureFlagResolver } from '@module-common';
import { Config, CONFIG_SERVICE, ConfigService } from '@module-config';
import { Test, TestingModule } from '@nestjs/testing';
import {
  DocumentsProcessor,
  INVOICE_DOCUMENTS_QUEUE_URL_KEY,
} from './documents-processing.service';
import { InvoiceMapper } from '../data';
import { EntityStubs } from '@module-persistence/test';

describe('Document processing', () => {
  let documentsProcessor: DocumentsProcessor;
  let sqsServiceMock: DeepMocked<SQSService>;
  let configServiceMock: DeepMocked<ConfigService>;
  let featureFlagResolver: FeatureFlagResolver;
  const contextMock: jest.Mock = jest.fn();

  beforeAll(async () => {
    configServiceMock = createMock<ConfigService>();
    sqsServiceMock = createMock<SQSService>();
    AppContextHolder.get = contextMock;
    const configMock = new Config(INVOICE_DOCUMENTS_QUEUE_URL_KEY, 'mockedUrl');
    configServiceMock.getValue.mockReturnValue(configMock);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsProcessor,
        InvoiceMapper,
        {
          provide: SQSService,
          useValue: sqsServiceMock,
        },
        {
          provide: CONFIG_SERVICE,
          useValue: configServiceMock,
        },
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();
    sqsServiceMock = module.get(SQSService);
    documentsProcessor = module.get(DocumentsProcessor);
    featureFlagResolver = module.get(FeatureFlagResolver);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });
  it('Document processor does not send messages to Step Functions on local dev', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValue(false);
    const invoice = EntityStubs.buildStubInvoice();
    const client = buildStubClient();
    const broker = buildStubBroker();
    await documentsProcessor.sendToProcess({
      entity: invoice,
      client,
      broker,
    });
    expect(sqsServiceMock.sendMessage).not.toHaveBeenCalled();
  });
  it('Document processor does send messages to Step Functions on local dev', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValue(true);
    contextMock.mockReturnValue({ accessToken: 'mockedToken' });
    const sendMessageSpy = jest
      .spyOn(sqsServiceMock, 'sendMessage')
      .mockResolvedValueOnce({
        MessageId: '1',
        $metadata: {},
      });

    const invoice = EntityStubs.buildStubInvoice();
    const client = buildStubClient();
    const broker = buildStubBroker();
    await documentsProcessor.sendToProcess({
      entity: invoice,
      client,
      broker,
    });
    expect(sendMessageSpy).toHaveBeenCalledTimes(1);
  });
  test('Invoice is sent for processing to SQS', async () => {
    contextMock.mockReturnValueOnce({ accessToken: 'mockedToken' });
    const spy = sqsServiceMock.sendMessage.mockResolvedValueOnce({
      MessageId: '1',
      $metadata: {},
    });
    const invoice = EntityStubs.buildStubInvoice();
    const client = buildStubClient();
    const broker = buildStubBroker();
    await documentsProcessor.sendToProcess({
      entity: invoice,
      client,
      broker,
    });
    expect(spy).toBeCalledTimes(1);
  });

  test('Authorization token is sent for processing to SQS', async () => {
    contextMock.mockReturnValueOnce({ accessToken: 'mockedToken' });
    const spy = sqsServiceMock.sendMessage.mockResolvedValueOnce({
      MessageId: '1',
      $metadata: {},
    });
    const invoice = EntityStubs.buildStubInvoice();
    const client = buildStubClient();
    const broker = buildStubBroker();
    await documentsProcessor.sendToProcess({
      entity: invoice,
      client,
      broker,
    });
    expect(spy).toBeCalledTimes(1);
    const messageAttributes = spy.mock.lastCall?.[2]?.MessageAttributes;
    expect(messageAttributes).toBeDefined();
    expect(messageAttributes?.authorizationToken).toBeDefined();
  });
});
