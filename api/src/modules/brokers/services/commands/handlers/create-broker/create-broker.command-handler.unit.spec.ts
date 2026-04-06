import { Test, TestingModule } from '@nestjs/testing';
import { mockMikroORMProvider, mockToken } from '@core/test';

import { CreateBrokerCommand } from '../../create-broker.command';
import { CreateBrokerCommandHandler } from './create-broker.command-handler';

import { BrokerApi } from '../../../../api';
import { AuthorityStatus, BrokerMapper } from '../../../../data';
import {
  BobtailStatus,
  Country,
  CreateBrokerRequest,
  Rating,
} from '../../../../data/web';
import { EntityStubs } from '@module-persistence/test';
import { BrokerCreateApiRequest } from '../../../../api/data';

describe('CreateBrokerCommandHandler', () => {
  let handler: CreateBrokerCommandHandler;
  let brokerMapper: jest.Mocked<BrokerMapper>;
  let brokerApi: jest.Mocked<BrokerApi>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [mockMikroORMProvider, CreateBrokerCommandHandler],
    })
      .useMocker((token) => mockToken(token))
      .compile();

    handler = module.get(CreateBrokerCommandHandler);
    brokerMapper = module.get(
      BrokerMapper,
    ) as unknown as jest.Mocked<BrokerMapper>;
    brokerApi = module.get(BrokerApi) as unknown as jest.Mocked<BrokerApi>;
  });

  const buildValidRequest = (): CreateBrokerRequest => ({
    mc: '123456',
    dot: '987654',
    businessName: 'Acme Logistics',
    doingBusinessAs: 'Acme',
    phoneNumber: '+1-555-0100',
    authorityDate: new Date('2024-01-01'),
    authorityStatus: AuthorityStatus.Active,
    bobtailStatus: BobtailStatus.Active,
    rating: Rating.A,
    externalRating: Rating.A,
    ratingReason: 'Solid payment history',
    portalUrl: 'https://portal.acme.test',
    address: '123 Main',
    address2: 'Suite 1',
    city: 'Springfield',
    state: 'CA',
    country: Country.US,
    zip: '90210',
    noaEmails: ['noa@acme.test'],
    invoiceDeliveryEmails: ['invoices@acme.test'],
    payStatusEmails: ['paystatus@acme.test'],
    requireOriginals: false,
    requireCopies: true,
    requireOnlineSubmit: false,
    requireFax: false,
    requireEmail: true,
    mailingAddress: 'PO Box 42',
    mailingAddress2: undefined,
    mailingCity: 'Springfield',
    mailingState: 'CA',
    mailingCountry: Country.US,
    mailingZip: '90210',
  });

  it('creates a config, builds API request, calls Broker API once, and returns the config', async () => {
    const brokerConfigStub = EntityStubs.buildBrokerFactoringConfigStub();

    jest
      .spyOn(brokerMapper, 'buildConfig')
      .mockResolvedValueOnce(brokerConfigStub);

    const apiRequestStub = {} as unknown as BrokerCreateApiRequest;
    const buildApiReqSpy = jest
      .spyOn(brokerMapper, 'buildApiCreateBrokerRequest')
      .mockReturnValueOnce(apiRequestStub);

    jest.spyOn(brokerApi, 'create');

    const req: CreateBrokerRequest = buildValidRequest();

    const result = await handler.execute(new CreateBrokerCommand(req));

    expect(brokerMapper.buildConfig).toHaveBeenCalledTimes(1);
    expect(buildApiReqSpy).toHaveBeenCalledTimes(1);
    expect(buildApiReqSpy).toHaveBeenCalledWith(req, {
      brokerId: brokerConfigStub.brokerId,
    });
    expect(brokerApi.create).toHaveBeenCalledTimes(1);
    expect(brokerApi.create).toHaveBeenCalledWith(apiRequestStub);
    expect(result).toBe(brokerConfigStub);
  });

  it('passes the correct brokerId into the API request builder', async () => {
    const brokerConfigStub = EntityStubs.buildBrokerFactoringConfigStub();

    jest
      .spyOn(brokerMapper, 'buildConfig')
      .mockResolvedValueOnce(brokerConfigStub);
    jest
      .spyOn(brokerMapper, 'buildApiCreateBrokerRequest')
      .mockReturnValueOnce({} as unknown as BrokerCreateApiRequest);
    jest.spyOn(brokerApi, 'create');

    const req: CreateBrokerRequest = buildValidRequest();

    await handler.execute(new CreateBrokerCommand(req));

    expect(brokerMapper.buildApiCreateBrokerRequest).toHaveBeenCalledWith(req, {
      brokerId: brokerConfigStub.brokerId,
    });

    expect(brokerApi.create).toHaveBeenCalledTimes(1);
  });
});
