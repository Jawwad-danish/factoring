import { mockToken } from '@core/test';
import { buildStubBroker } from '@module-brokers/test';
import { buildStubClient } from '@module-clients/test';
import {
  CommandInvoiceContext,
  PurchaseInvoiceRequest,
} from '@module-invoices/data';
import { EntityStubs } from '@module-persistence/test';
import { Test, TestingModule } from '@nestjs/testing';
import Big from 'big.js';
import { ReserveFeeRule } from './reserve-fee-rule';
import {
  ReserveInvoiceRepository,
  ReserveRepository,
} from '@module-persistence';

describe('Reserve Fee Calculation rule', () => {
  let rule: ReserveFeeRule;
  let reserveRepository: ReserveRepository;
  let reserveInvoiceRepository: ReserveInvoiceRepository;
  const client = buildStubClient();
  const broker = buildStubBroker();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReserveFeeRule],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    rule = module.get(ReserveFeeRule);
    reserveRepository = module.get(ReserveRepository);
    reserveInvoiceRepository = module.get(ReserveInvoiceRepository);
  }, 60000);

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Expect Reserve Fee Calculation rule should be defined', () => {
    expect(rule).toBeDefined();
  });

  it('Reserve entry is not created if fee is 0', async () => {
    const reserveSpy = jest
      .spyOn(reserveRepository, 'persist')
      .mockImplementation();
    const reserveInvoiceSpy = jest
      .spyOn(reserveInvoiceRepository, 'persist')
      .mockImplementation();

    const payload = new PurchaseInvoiceRequest();
    const entity = EntityStubs.buildStubInvoice({
      accountsReceivableValue: new Big(320),
      reserveFee: new Big(0),
    });

    const context: CommandInvoiceContext<PurchaseInvoiceRequest> = {
      client: client,
      broker: broker,
      entity: entity,
      payload: payload,
    };
    await rule.run(context);
    expect(reserveSpy).not.toBeCalled();
    expect(reserveInvoiceSpy).not.toBeCalled();
  });

  it('Reserve fee is calculated when purchased is performed and reserve entry is created', async () => {
    const reserveSpy = jest
      .spyOn(reserveRepository, 'persist')
      .mockImplementation();
    const reserveInvoiceSpy = jest
      .spyOn(reserveInvoiceRepository, 'persist')
      .mockImplementation();

    const payload = new PurchaseInvoiceRequest();
    const entity = EntityStubs.buildStubInvoice({
      accountsReceivableValue: new Big(320),
      reserveFee: new Big(4.8),
    });

    const context: CommandInvoiceContext<PurchaseInvoiceRequest> = {
      client: client,
      broker: broker,
      entity: entity,
      payload: payload,
    };
    await rule.run(context);
    expect(entity.reserveFee.toFixed()).toStrictEqual('4.8');
    expect(reserveSpy).toBeCalledTimes(1);
    expect(reserveInvoiceSpy).toBeCalledTimes(1);
  });
});
