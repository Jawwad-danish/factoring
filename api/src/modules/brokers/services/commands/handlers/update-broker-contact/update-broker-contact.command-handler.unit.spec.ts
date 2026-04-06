import { Test, TestingModule } from '@nestjs/testing';
import { mockMikroORMProvider, mockToken } from '@core/test';
import { UpdateBrokerContactCommandHandler } from './update-broker-contact.command-handler';
import { UpdateBrokerContactCommand } from '../../..';
import { BrokerApi } from '../../../../api';
import { AppContextHolder } from '@core/app-context';
import { BrokerRole, UpdateBrokerContactRequest } from '../../../../data';
import { buildStubBrokerContact } from '../../../../test';

describe('UpdateBrokerContactCommandHandler', () => {
  let handler: UpdateBrokerContactCommandHandler;
  let brokerApi: jest.Mocked<BrokerApi>;

  const USER_ID = 'user-123';
  const BROKER_ID = 'broker-abc';
  const CONTACT_ID = 'contact-xyz';

  const buildRequest = (
    overrides: Partial<UpdateBrokerContactRequest> = {},
  ): UpdateBrokerContactRequest => ({
    name: 'Jamie Doe',
    phone: '+1-555-0000',
    email: 'jamie@acme.test',
    role: BrokerRole.Owner,
    isPrimary: false,
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [mockMikroORMProvider, UpdateBrokerContactCommandHandler],
    })
      .useMocker((token) => mockToken(token))
      .compile();

    handler = module.get(UpdateBrokerContactCommandHandler);
    brokerApi = module.get(BrokerApi);

    const fakeCtx = {
      getAuthentication: () => ({ principal: { id: USER_ID } }),
    } as any;
    jest.spyOn(AppContextHolder, 'get').mockReturnValue(fakeCtx);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('sets updatedBy from principal.id, calls BrokerApi once, and returns the updated contact', async () => {
    const req = buildRequest();
    const cmd = new UpdateBrokerContactCommand(BROKER_ID, CONTACT_ID, req);

    const apiResult = buildStubBrokerContact();
    brokerApi.updateBrokerContact.mockResolvedValueOnce(apiResult);

    const result = await handler.execute(cmd);

    expect(req.updatedBy).toBe(USER_ID);

    expect(brokerApi.updateBrokerContact).toHaveBeenCalledTimes(1);
    expect(brokerApi.updateBrokerContact).toHaveBeenCalledWith(
      BROKER_ID,
      CONTACT_ID,
      req,
    );

    expect(result).toBe(apiResult);
  });

  it('overwrites an existing updatedBy with principal.id', async () => {
    const req = buildRequest({ updatedBy: 'another-user' });
    const cmd = new UpdateBrokerContactCommand(BROKER_ID, CONTACT_ID, req);

    brokerApi.updateBrokerContact.mockResolvedValueOnce(
      buildStubBrokerContact(),
    );

    await handler.execute(cmd);

    expect(req.updatedBy).toBe(USER_ID);
    expect(brokerApi.updateBrokerContact).toHaveBeenCalledWith(
      BROKER_ID,
      CONTACT_ID,
      req,
    );
  });

  it('passes through the provided brokerId and contactId unchanged', async () => {
    const anotherBrokerId = 'broker-777';
    const anotherContactId = 'contact-888';
    const req = buildRequest();

    brokerApi.updateBrokerContact.mockResolvedValueOnce(
      buildStubBrokerContact(),
    );

    await handler.execute(
      new UpdateBrokerContactCommand(anotherBrokerId, anotherContactId, req),
    );

    expect(brokerApi.updateBrokerContact).toHaveBeenCalledTimes(1);
    expect(brokerApi.updateBrokerContact).toHaveBeenCalledWith(
      anotherBrokerId,
      anotherContactId,
      req,
    );
  });
});
