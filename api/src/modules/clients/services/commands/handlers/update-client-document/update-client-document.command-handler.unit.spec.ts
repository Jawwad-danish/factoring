import { Test, TestingModule } from '@nestjs/testing';
import { UpdateClientDocumentCommandHandler } from './update-client-document.command-handler';
import { ClientApi } from '../../../../api';
import { UpdateClientDocumentCommand } from '../../update-client-document.command';
import { ClientDocumentType } from '@module-clients/data';

describe('UpdateClientDocumentCommandHandler', () => {
  let handler: UpdateClientDocumentCommandHandler;
  let clientApi: ClientApi;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateClientDocumentCommandHandler,
        {
          provide: ClientApi,
          useValue: { updateDocument: jest.fn() },
        },
      ],
    }).compile();

    handler = module.get(UpdateClientDocumentCommandHandler);
    clientApi = module.get(ClientApi);
  });

  it('should call clientApi.updateDocument and return result', async () => {
    const clientId = 'client-id';
    const documentId = 'doc-id';
    const request = {
      id: documentId,
      internalUrl: 'int',
      externalUrl: 'ext',
      type: ClientDocumentType.MC_AUTHORITY,
    };
    const expectedResult = { ...request };

    (clientApi.updateDocument as jest.Mock).mockResolvedValueOnce(
      expectedResult,
    );

    const command = new UpdateClientDocumentCommand(
      clientId,
      documentId,
      request,
    );
    const result = await handler.execute(command);

    expect(clientApi.updateDocument).toHaveBeenCalledWith(
      clientId,
      documentId,
      request,
    );
    expect(result).toBe(expectedResult);
  });
});
