import { UpdateBrokerDocumentCommandHandler } from './update-broker-document.command-handler';
import { BrokerApi } from '../../../../api';
import { Test, TestingModule } from '@nestjs/testing';
import { mockToken } from '@core/test';
import { BrokerDocumentsStubs } from '@module-brokers/test';
import { UpdateBrokerDocumentCommand } from '../../update-broker-document.command';
import { BrokerDocumentsMapper } from '../../../../data/mappers';

describe('UpdateBrokerDocumentCommandHandler', () => {
  let handler: UpdateBrokerDocumentCommandHandler;
  let brokerDocumentsMapper: BrokerDocumentsMapper;
  let brokerApi: BrokerApi;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UpdateBrokerDocumentCommandHandler],
    })
      .useMocker((token) => mockToken(token))
      .compile();

    handler = module.get(UpdateBrokerDocumentCommandHandler);
    brokerApi = module.get(BrokerApi);
    brokerDocumentsMapper = module.get(BrokerDocumentsMapper);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should update the broker document', async () => {
    const brokerDocumentStub = BrokerDocumentsStubs.buildStubBrokerDocument();
    const brokerDocumentRequestStub =
      BrokerDocumentsStubs.buildStubBrokerDocumentsRequest();
    jest
      .spyOn(brokerApi, 'updateBrokerDocument')
      .mockResolvedValueOnce(
        BrokerDocumentsStubs.buildStubBrokerDocumentResponse(),
      );
    jest
      .spyOn(brokerDocumentsMapper, 'brokerDocumentResponseToModel')
      .mockResolvedValueOnce(brokerDocumentStub);

    const command = new UpdateBrokerDocumentCommand(
      '123',
      '123',
      brokerDocumentRequestStub,
    );
    const response = await handler.execute(command);

    expect(brokerApi.updateBrokerDocument).toHaveBeenCalledTimes(1);
    expect(brokerApi.updateBrokerDocument).toHaveBeenCalledWith(
      '123',
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
