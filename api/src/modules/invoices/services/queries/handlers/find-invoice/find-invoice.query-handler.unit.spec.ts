import { mockToken } from '@core/test';
import { Broker, BrokerService } from '@module-brokers';
import { buildStubBroker } from '@module-brokers/test';
import { Client, ChargebackReserve, ClientService } from '@module-clients';
import { buildStubClient } from '@module-clients/test';
import {
  ClientBrokerAssignmentRepository,
  InvoiceRepository,
} from '@module-persistence/repositories';
import { Test, TestingModule } from '@nestjs/testing';
import Big from 'big.js';
import { UUID } from '@core/uuid';
import { Invoice, InvoiceMapper } from '../../../../data';
import { builStubInvoice } from '../../../../tests';
import { InvoiceDataAccess } from '../../../invoice-data-access';
import { FindInvoiceQuery } from '../../find-invoice.query';
import { FindInvoiceQueryHandler } from './find-invoice.query-handler';
import { EntityStubs } from '@module-persistence/test';

describe('FindInvoiceQueryHandler', () => {
  let invoiceRepository: InvoiceRepository;
  let clientBrokerAssignmentRepository: ClientBrokerAssignmentRepository;
  let queryHandler: FindInvoiceQueryHandler;
  let mapper: InvoiceMapper;
  let clientService: ClientService;
  let brokerService: BrokerService;
  let invoiceDataAccess: InvoiceDataAccess;

  const mockHappyPath = ({
    broker = buildStubBroker(),
    client = buildStubClient(),
    invoice = builStubInvoice(),
    dilutionRate = new Big(10),
    chargeback: lastChargeback = new ChargebackReserve({
      amount: new Big(20),
      createdAt: new Date(),
    }),
  }: {
    broker?: Broker;
    client?: Client;
    invoice?: Invoice;
    dilutionRate?: Big;
    chargeback?: ChargebackReserve;
  }) => {
    jest
      .spyOn(invoiceRepository, 'getOneById')
      .mockResolvedValueOnce(EntityStubs.buildStubInvoice());
    jest
      .spyOn(clientBrokerAssignmentRepository, 'getOne')
      .mockResolvedValueOnce(EntityStubs.buildClientBrokerAssignment());
    jest.spyOn(mapper, 'entityToModel').mockResolvedValueOnce(invoice);
    jest.spyOn(clientService, 'getOneById').mockResolvedValueOnce(client);
    jest
      .spyOn(invoiceDataAccess, 'getDilutionRate')
      .mockResolvedValueOnce(dilutionRate);
    jest
      .spyOn(invoiceDataAccess, 'getClientRecentChargebacks')
      .mockResolvedValueOnce([lastChargeback]);
    jest.spyOn(brokerService, 'findOneById').mockResolvedValueOnce(broker);
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FindInvoiceQueryHandler],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    queryHandler = module.get(FindInvoiceQueryHandler);
    invoiceRepository = module.get(InvoiceRepository);
    clientBrokerAssignmentRepository = module.get(
      ClientBrokerAssignmentRepository,
    );
    mapper = module.get(InvoiceMapper);
    clientService = module.get(ClientService);
    invoiceDataAccess = module.get(InvoiceDataAccess);
    brokerService = module.get(BrokerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Should be defined', () => {
    expect(queryHandler).toBeDefined();
  });

  it('Client is assigned to invoice', async () => {
    const client = buildStubClient({
      dilutionRate: new Big(0),
    });
    const invoice = builStubInvoice();
    mockHappyPath({
      client,
      invoice,
    });

    await queryHandler.execute(new FindInvoiceQuery(UUID.get()));
    expect(invoice.client).toBeDefined();
    expect(invoice.client?.id).toBe(client.id);
  });

  it('Client dilution rate is set', async () => {
    const client = buildStubClient({
      dilutionRate: new Big(0),
    });
    mockHappyPath({
      client,
      dilutionRate: new Big(10),
    });

    await queryHandler.execute(new FindInvoiceQuery(UUID.get()));
    expect(client.dilutionRate?.toNumber()).toBe(10);
  });

  it('Client last chargeback is set', async () => {
    const client = buildStubClient({
      chargebacks: [
        new ChargebackReserve({
          amount: new Big(20),
          createdAt: new Date(),
        }),
      ],
    });
    mockHappyPath({
      client,
      chargeback: new ChargebackReserve({
        amount: new Big(20),
        createdAt: new Date(),
      }),
    });

    await queryHandler.execute(new FindInvoiceQuery(UUID.get()));
    expect(client.chargebacks?.[0]?.amount.toNumber()).toBe(20);
  });

  it('Broker service is not called when broker id is null', async () => {
    mockHappyPath({
      invoice: builStubInvoice({
        brokerId: null,
      }),
    });

    await queryHandler.execute(new FindInvoiceQuery(UUID.get()));
    expect(jest.spyOn(brokerService, 'findOneById')).toBeCalledTimes(0);
  });

  it('Broker is assigned to invoice', async () => {
    const broker = buildStubBroker();
    const invoice = builStubInvoice({
      broker: null,
      brokerId: UUID.get(),
    });
    mockHappyPath({
      broker,
      invoice,
    });

    await queryHandler.execute(new FindInvoiceQuery(UUID.get()));
    expect(invoice.broker).toBeDefined();
    expect(invoice.broker?.id).toBe(broker.id);
  });
});
