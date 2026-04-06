import { BrokerApi } from '../../../../api';
import { Test, TestingModule } from '@nestjs/testing';
import { mockToken } from '@core/test';
import { BrokerDocumentsStubs } from '@module-brokers/test';
import { CreateBrokerDocumentCommand } from '../../create-broker-document.command';
import { BrokerDocumentsMapper } from '../../../../data/mappers';
import { CreateBrokerDocumentCommandHandler } from './create-broker-document.command-handler';

describe('CreateBrokerDocumentCommandHandler', () => {
  let handler: CreateBrokerDocumentCommandHandler;
  let brokerDocumentsMapper: BrokerDocumentsMapper;
  let brokerApi: BrokerApi;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CreateBrokerDocumentCommandHandler],
    })
      .useMocker((token) => mockToken(token))
      .compile();

    handler = module.get(CreateBrokerDocumentCommandHandler);
    brokerApi = module.get(BrokerApi);
    brokerDocumentsMapper = module.get(BrokerDocumentsMapper);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should create the broker document', async () => {
    const brokerDocumentStub = BrokerDocumentsStubs.buildStubBrokerDocument();
    const brokerDocumentRequestStub =
      BrokerDocumentsStubs.buildStubBrokerDocumentsRequest();
    jest
      .spyOn(brokerApi, 'createBrokerDocument')
      .mockResolvedValueOnce(
        BrokerDocumentsStubs.buildStubBrokerDocumentResponse(),
      );
    jest
      .spyOn(brokerDocumentsMapper, 'brokerDocumentResponseToModel')
      .mockResolvedValueOnce(brokerDocumentStub);

    const command = new CreateBrokerDocumentCommand(
      '123',
      brokerDocumentRequestStub,
    );
    const response = await handler.execute(command);

    expect(brokerApi.createBrokerDocument).toHaveBeenCalledTimes(1);
    expect(brokerApi.createBrokerDocument).toHaveBeenCalledWith(
      '123',
      brokerDocumentRequestStub,
    );
    expect(
      brokerDocumentsMapper.brokerDocumentResponseToModel,
    ).toHaveBeenCalledTimes(1);
    expect(
      brokerDocumentsMapper.brokerDocumentResponseToModel,
    ).toHaveBeenCalledWith(
      BrokerDocumentsStubs.buildStubBrokerDocumentResponse(),
    );
    expect(response).toEqual(brokerDocumentStub);
  });
});
