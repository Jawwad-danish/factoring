import { BrokerApi } from '../../../../api';
import { Test, TestingModule } from '@nestjs/testing';
import { mockToken } from '@core/test';
import { BrokerDocumentsStubs } from '@module-brokers/test';
import { DeleteBrokerDocumentCommand } from '../../delete-broker-document.command';
import { DeleteBrokerDocumentCommandHandler } from './delete-broker-document.command-handler';

describe('DeleteBrokerDocumentCommandHandler', () => {
  let handler: DeleteBrokerDocumentCommandHandler;
  let brokerApi: BrokerApi;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DeleteBrokerDocumentCommandHandler],
    })
      .useMocker((token) => mockToken(token))
      .compile();

    handler = module.get(DeleteBrokerDocumentCommandHandler);
    brokerApi = module.get(BrokerApi);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should delete the broker document', async () => {
    const brokerDocumentStub = BrokerDocumentsStubs.buildStubBrokerDocument();
    jest.spyOn(brokerApi, 'deleteBrokerDocument').mockResolvedValueOnce();

    const command = new DeleteBrokerDocumentCommand(
      '123',
      brokerDocumentStub.id,
    );
    await handler.execute(command);

    expect(brokerApi.deleteBrokerDocument).toHaveBeenCalledTimes(1);
    expect(brokerApi.deleteBrokerDocument).toHaveBeenCalledWith(
      '123',
      brokerDocumentStub.id,
    );
  });
});
