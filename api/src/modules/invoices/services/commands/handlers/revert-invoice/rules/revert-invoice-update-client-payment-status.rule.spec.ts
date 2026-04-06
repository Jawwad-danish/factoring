import { mockToken } from '@core/test';
import { buildStubClient } from '@module-clients/test';
import {
  CommandInvoiceContext,
  RevertInvoiceRequest,
} from '@module-invoices/data';
import {
  ClientPaymentStatus,
  EntityStubs,
  InvoiceClientPaymentRepository,
  InvoiceStatus,
  ReserveClientPaymentRepository,
} from '@module-persistence';
import { Test, TestingModule } from '@nestjs/testing';
import { RevertInvoiceUpdateClientPaymentStatusRule } from './revert-invoice-update-client-payment-status.rule';

describe('Revert invoice update client payment status rule', () => {
  let rule: RevertInvoiceUpdateClientPaymentStatusRule;
  let invoiceClientPaymentRepository: InvoiceClientPaymentRepository;
  let reserveClientPaymentRepository: ReserveClientPaymentRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RevertInvoiceUpdateClientPaymentStatusRule],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    rule = module.get(RevertInvoiceUpdateClientPaymentStatusRule);
    invoiceClientPaymentRepository = module.get<InvoiceClientPaymentRepository>(
      InvoiceClientPaymentRepository,
    );
    reserveClientPaymentRepository = module.get<ReserveClientPaymentRepository>(
      ReserveClientPaymentRepository,
    );
  }, 60000);

  afterEach(() => {
    jest.clearAllMocks();
  });
  it('Expect Upload to portal rule should be defined', async () => {
    expect(rule).toBeDefined();
  });

  it('Rule changes client payment status for pending client payment', async () => {
    const reserveClientPaymentRepoSpy = jest.spyOn(
      reserveClientPaymentRepository,
      'persist',
    );
    reserveClientPaymentRepoSpy.mockImplementation(jest.fn());
    const context: CommandInvoiceContext<RevertInvoiceRequest> = {
      entity: EntityStubs.buildStubInvoice({
        status: InvoiceStatus.Purchased,
        clientPaymentStatus: ClientPaymentStatus.Pending,
      }),
      client: buildStubClient(),
      broker: null,
      payload: {},
    };
    await rule.run(context);
    expect(context.entity.clientPaymentStatus).toEqual(
      ClientPaymentStatus.NotApplicable,
    );
    expect(reserveClientPaymentRepoSpy).toBeCalledTimes(0);
  });

  it('Rule changes client payment status and reverts reserves for failed client payment', async () => {
    const reserveClientPaymentPersistSpy = jest.spyOn(
      reserveClientPaymentRepository,
      'persist',
    );
    reserveClientPaymentPersistSpy.mockImplementation(jest.fn());
    const invoiceClientPaymentFindAllSpy = jest.spyOn(
      invoiceClientPaymentRepository,
      'findAll',
    );
    const reserveClientpaymentFindAllSpy = jest.spyOn(
      reserveClientPaymentRepository,
      'findAll',
    );
    reserveClientpaymentFindAllSpy
      .mockImplementation(jest.fn())
      .mockReturnValue(
        Promise.resolve([[EntityStubs.buildStubReserveClientPayment()], 1]),
      );
    invoiceClientPaymentFindAllSpy
      .mockImplementation(jest.fn())
      .mockReturnValue(
        Promise.resolve([[EntityStubs.buildStubInvoiceClientPayment()], 1]),
      );

    const context: CommandInvoiceContext<RevertInvoiceRequest> = {
      entity: EntityStubs.buildStubInvoice({
        status: InvoiceStatus.Purchased,
        clientPaymentStatus: ClientPaymentStatus.Failed,
      }),
      client: buildStubClient(),
      broker: null,
      payload: {},
    };
    await rule.run(context);
    expect(context.entity.clientPaymentStatus).toEqual(
      ClientPaymentStatus.NotApplicable,
    );
    expect(reserveClientPaymentPersistSpy).toBeCalledTimes(1);
  });
});
