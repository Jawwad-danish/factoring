import { mockToken } from '@core/test';
import { buildStubClient } from '@module-clients/test';
import { CommandRunner } from '@module-cqrs';
import {
  CommandInvoiceContext,
  RevertInvoiceRequest,
} from '@module-invoices/data';
import { InvoiceStatus, ReserveInvoiceRepository } from '@module-persistence';
import { DeleteReserveCommand } from '@module-reserves/commands';
import { Test, TestingModule } from '@nestjs/testing';
import Big from 'big.js';
import { RevertDeductionReserveRule } from './revert-deduction-reserve-rule';
import { EntityStubs } from '@module-persistence/test';

describe('Revert invoice deduction reserve rule', () => {
  let rule: RevertDeductionReserveRule;
  let reserveInvoiceRepository: ReserveInvoiceRepository;
  let commandRunner: CommandRunner;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RevertDeductionReserveRule],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    rule = module.get(RevertDeductionReserveRule);
    reserveInvoiceRepository = module.get(ReserveInvoiceRepository);
    commandRunner = module.get(CommandRunner);
  }, 60000);

  afterEach(() => {
    jest.clearAllMocks();
  });
  it('Expect rule to be defined', async () => {
    expect(rule).toBeDefined();
  });

  it('Nothing is done if deduction is 0', async () => {
    const reserveInvoiceRepositorySpy = jest.spyOn(
      reserveInvoiceRepository,
      'findChargebackReserveByInvoiceId',
    );
    const context: CommandInvoiceContext<RevertInvoiceRequest> = {
      entity: EntityStubs.buildStubInvoice({
        status: InvoiceStatus.Purchased,
        deduction: Big(0),
      }),
      client: buildStubClient(),
      broker: null,
      payload: {},
    };
    await rule.run(context);
    expect(reserveInvoiceRepositorySpy).toBeCalledTimes(0);
  });

  it('Entity is updated and inverse reserve is created if reserve fee > 0', async () => {
    const reserveInvoiceRepositorySpy = jest.spyOn(
      reserveInvoiceRepository,
      'findChargebackReserveByInvoiceId',
    );
    reserveInvoiceRepositorySpy.mockResolvedValueOnce(
      EntityStubs.buildStubReserveInvoice().reserve,
    );
    reserveInvoiceRepositorySpy.mockImplementation(jest.fn());
    const commandRunnerSpy = jest.spyOn(commandRunner, 'run');

    const entity = EntityStubs.buildStubInvoice({
      status: InvoiceStatus.Purchased,
      reserveFee: Big(1),
    });
    const context: CommandInvoiceContext<RevertInvoiceRequest> = {
      entity: entity,
      client: buildStubClient(),
      broker: null,
      payload: {},
    };
    await rule.run(context);
    expect(reserveInvoiceRepositorySpy).toBeCalledTimes(1);
    expect(commandRunnerSpy.mock.calls[0][0]).toBeInstanceOf(
      DeleteReserveCommand,
    );
  });
});
