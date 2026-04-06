import { createMock } from '@golevelup/ts-jest';
import { BrokerService } from '@module-brokers';
import { ClientService } from '@module-clients';
import { Test, TestingModule } from '@nestjs/testing';
import { UUID } from '@core/uuid';
import { FindBrokerClientQuery } from '../../find-broker-client.query';
import { FindBrokerClientQueryHandler } from './find-broker-client.query-handler';
import { InvoiceDataAccess } from '../../../invoice-data-access';

describe('Find broker client query handler', () => {
  let queryHandler: FindBrokerClientQueryHandler;
  const clientServiceMock = createMock<ClientService>();
  const brokerServiceMock = createMock<BrokerService>();
  const invoiceDataAccessMock = createMock<InvoiceDataAccess>();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindBrokerClientQueryHandler,
        ClientService,
        BrokerService,
        InvoiceDataAccess,
      ],
    })

      .overrideProvider(ClientService)
      .useValue(clientServiceMock)
      .overrideProvider(BrokerService)
      .useValue(brokerServiceMock)
      .overrideProvider(InvoiceDataAccess)
      .useValue(invoiceDataAccessMock)
      .compile();

    queryHandler = module.get(FindBrokerClientQueryHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Should be defined', () => {
    expect(queryHandler).toBeDefined();
  });

  it('External services are called', async () => {
    const clientId = UUID.get();
    const brokerId = UUID.get();
    await queryHandler.execute(new FindBrokerClientQuery(clientId, brokerId));
    expect(clientServiceMock.getOneById).toBeCalledTimes(1);
    expect(brokerServiceMock.findOneById).toBeCalledTimes(1);
    expect(invoiceDataAccessMock.getDilutionRate).toBeCalledTimes(1);
    expect(invoiceDataAccessMock.getClientRecentChargebacks).toBeCalledTimes(1);
  });

  it('Broker service is not called if broker id is null', async () => {
    const clientId = UUID.get();
    const brokerId = null;
    await queryHandler.execute(new FindBrokerClientQuery(clientId, brokerId));
    expect(clientServiceMock.getOneById).toBeCalledTimes(1);
    expect(brokerServiceMock.findOneById).toBeCalledTimes(0);
    expect(invoiceDataAccessMock.getDilutionRate).toBeCalledTimes(1);
    expect(invoiceDataAccessMock.getClientRecentChargebacks).toBeCalledTimes(1);
  });
});
