import { Test, TestingModule } from '@nestjs/testing';
import { mockMikroORMProvider, mockToken } from '@core/test';
import { CreateBrokerContactCommandHandler } from './create-broker-contact.command-handler';
import { CreateBrokerContactCommand } from '../../create-broker-contact-command';
import { BrokerApi } from '../../../../api';
import { AppContextHolder } from '@core/app-context';
import { BrokerRole, CreateBrokerContactRequest } from '../../../../data';
import { buildStubBrokerContact } from '../../../../test';

describe('CreateBrokerContactCommandHandler', () => {
  let handler: CreateBrokerContactCommandHandler;
  let brokerApi: jest.Mocked<BrokerApi>;

  const USER_ID = 'user-123';
  const BROKER_ID = 'broker-abc';

  const buildRequest = (
    overrides: Partial<CreateBrokerContactRequest> = {},
  ): CreateBrokerContactRequest => ({
    name: 'Jamie Doe',
    phone: '+1-555-0000',
    email: 'jamie@acme.test',
    countryPhoneCode: '+1',
    role: BrokerRole.Accounting,
    isPrimary: true,
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [mockMikroORMProvider, CreateBrokerContactCommandHandler],
    })
      .useMocker((token) => mockToken(token))
      .compile();

    handler = module.get(CreateBrokerContactCommandHandler);
    brokerApi = module.get(BrokerApi);

    const fakeCtx = {
      getAuthentication: () => ({ principal: { id: USER_ID } }),
    } as any;
    jest.spyOn(AppContextHolder, 'get').mockReturnValue(fakeCtx);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('sets createdBy from principal.id, calls BrokerApi once, and returns the created contact', async () => {
    const req = buildRequest();
    const command = new CreateBrokerContactCommand(BROKER_ID, req);

    const apiResult = buildStubBrokerContact();
    brokerApi.createBrokerContact.mockResolvedValueOnce(apiResult);

    const result = await handler.execute(command);

    expect(req.createdBy).toBe(USER_ID);

    expect(brokerApi.createBrokerContact).toHaveBeenCalledTimes(1);
    expect(brokerApi.createBrokerContact).toHaveBeenCalledWith(BROKER_ID, req);

    expect(result).toBe(apiResult);
  });

  it('overwrites an existing createdBy with principal.id', async () => {
    const req = buildRequest({ createdBy: 'someone-else' });
    const command = new CreateBrokerContactCommand(BROKER_ID, req);

    const apiResult = buildStubBrokerContact();
    brokerApi.createBrokerContact.mockResolvedValueOnce(apiResult);

    await handler.execute(command);

    expect(req.createdBy).toBe(USER_ID);
    expect(brokerApi.createBrokerContact).toHaveBeenCalledWith(BROKER_ID, req);
  });

  it('passes through the provided broker id unchanged', async () => {
    const anotherBrokerId = 'broker-xyz';
    const req = buildRequest();
    const command = new CreateBrokerContactCommand(anotherBrokerId, req);

    brokerApi.createBrokerContact.mockResolvedValueOnce(
      buildStubBrokerContact(),
    );

    await handler.execute(command);

    expect(brokerApi.createBrokerContact).toHaveBeenCalledTimes(1);
    expect(brokerApi.createBrokerContact).toHaveBeenCalledWith(
      anotherBrokerId,
      req,
    );
  });
});
