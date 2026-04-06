import { mockMikroORMProvider } from '@core/test';
import { createMock } from '@golevelup/ts-jest';
import { InvoiceChangeActionsExecutor } from '@module-invoices-tag-activity';
import {
  ClientBatchPaymentRepository,
  Repositories,
} from '@module-persistence';
import { Test, TestingModule } from '@nestjs/testing';
import { DebitUpdateTransferStatusStrategy } from './debit-update-transfer-status.strategy';

describe('DebitUpdateTransferStatusStrategy', () => {
  let strategy: DebitUpdateTransferStatusStrategy;
  const clientBatchPaymentRepository =
    createMock<ClientBatchPaymentRepository>();
  const repositories = createMock<Repositories>({
    clientBatchPayment: clientBatchPaymentRepository,
  });
  const invoiceChangeActionsExecutor =
    createMock<InvoiceChangeActionsExecutor>();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DebitUpdateTransferStatusStrategy,
        mockMikroORMProvider,
        {
          provide: Repositories,
          useValue: repositories,
        },
        {
          provide: InvoiceChangeActionsExecutor,
          useValue: invoiceChangeActionsExecutor,
        },
      ],
    }).compile();

    strategy = module.get(DebitUpdateTransferStatusStrategy);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });
});
