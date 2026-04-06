import { mockToken } from '@core/test';
import { EntityStubs } from '@module-persistence/test';
import { buildStubClient } from '@module-clients/test';
import { buildStubBroker } from '@module-brokers/test';
import { Test, TestingModule } from '@nestjs/testing';
import {
  CommandInvoiceContext,
  PurchaseInvoiceRequest,
} from '@module-invoices/data';
import { PurchaseDeductionRule } from '.';
import Big from 'big.js';
import {
  ReserveInvoiceRepository,
  ReserveRepository,
} from '@module-persistence/repositories';
import { ReserveEntity, ReserveReason } from '@module-persistence/entities';

describe('Purchase deduction rule', () => {
  let rule: PurchaseDeductionRule;
  let reserveRepository: ReserveRepository;
  let reserveInvoiceRepository: ReserveInvoiceRepository;
  const client = buildStubClient();
  const broker = buildStubBroker();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PurchaseDeductionRule],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    rule = module.get<PurchaseDeductionRule>(PurchaseDeductionRule);
    reserveRepository = module.get<ReserveRepository>(ReserveRepository);
    reserveInvoiceRepository = module.get(ReserveInvoiceRepository);
  }, 60000);

  it('Expect Purchase Deduction Rule should be defined', () => {
    expect(rule).toBeDefined();
  });

  it('Check reserve entity is saved when deduction is performed', async () => {
    const reserveSpy = jest
      .spyOn(reserveRepository, 'persist')
      .mockImplementation();
    jest
      .spyOn(reserveInvoiceRepository, 'persist')
      .mockReturnValue(EntityStubs.buildStubReserveInvoice());
    const payload = new PurchaseInvoiceRequest();
    payload.deduction = Big(300);

    const context: CommandInvoiceContext<PurchaseInvoiceRequest> = {
      client: client,
      broker: broker,
      entity: EntityStubs.buildStubInvoice({
        lineHaulRate: Big(1000),
      }),
      payload: payload,
    };

    await rule.run(context);
    expect(reserveSpy).toHaveBeenCalledWith(expect.any(ReserveEntity));
    expect(reserveSpy).toHaveBeenCalledWith(
      expect.objectContaining({ reason: ReserveReason.Chargeback }),
    );
    expect(reserveInvoiceRepository.persist).toBeCalledTimes(1);
  });
});
