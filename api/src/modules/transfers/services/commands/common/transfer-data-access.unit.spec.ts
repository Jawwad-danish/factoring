import { mockMikroORMProvider } from '@core/test';
import { createMock } from '@golevelup/ts-jest';
import { QueryBuilder } from '@mikro-orm/postgresql';
import {
  ClientPaymentStatus,
  InvoiceEntity,
  InvoiceStatus,
  PaymentStatus,
  RecordStatus,
  ReserveReason,
} from '@module-persistence/entities';
import {
  ClientPaymentRepository,
  InvoiceRepository,
  Repositories,
  ReserveRepository,
} from '@module-persistence/repositories';
import { Test } from '@nestjs/testing';
import { TransferDataAccess } from './transfer-data-access';

describe('TransferDataAccess', () => {
  let dataAccess: TransferDataAccess;
  const queryBuilderMock = createMock<QueryBuilder<InvoiceEntity>>({
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue([{ id: 'locked-invoice-id' }]),
  });

  const invoiceRepository = createMock<InvoiceRepository>();
  invoiceRepository.queryBuilder.mockReturnValue(queryBuilderMock);
  const reserveRepository = createMock<ReserveRepository>();
  const clientPaymentRepository = createMock<ClientPaymentRepository>();

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [mockMikroORMProvider, Repositories, TransferDataAccess],
    })
      .overrideProvider(Repositories)
      .useValue(
        createMock<Repositories>({
          invoice: invoiceRepository,
          reserve: reserveRepository,
          clientPaymentRepository: clientPaymentRepository,
        }),
      )
      .compile();

    dataAccess = module.get(TransferDataAccess);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('When fetching invoices for expedite transfer, pending and failed client payment are included', async () => {
    await dataAccess.getInvoicesForExpediteTransfer(['id']);

    expect(invoiceRepository.find).toHaveBeenCalledWith({
      clientId: { $in: ['id'] },
      status: {
        $in: [InvoiceStatus.UnderReview, InvoiceStatus.Purchased],
      },
      clientPaymentStatus: {
        $ne: null,
        $in: [
          ClientPaymentStatus.NotApplicable,
          ClientPaymentStatus.Pending,
          ClientPaymentStatus.Failed,
        ],
      },
      recordStatus: RecordStatus.Active,
    });
  });

  it('When fetching invoices for expedite transfer, purchased invoices are included', async () => {
    await dataAccess.getInvoicesForExpediteTransfer(['id']);

    expect(invoiceRepository.find).toHaveBeenCalledWith({
      clientId: { $in: ['id'] },
      status: {
        $in: [InvoiceStatus.UnderReview, InvoiceStatus.Purchased],
      },
      clientPaymentStatus: {
        $ne: null,
        $in: [
          ClientPaymentStatus.NotApplicable,
          ClientPaymentStatus.Pending,
          ClientPaymentStatus.Failed,
        ],
      },
      recordStatus: RecordStatus.Active,
    });
  });

  it('When fetching invoices for regular transfer, pending and failed client payment are included', async () => {
    await dataAccess.getInvoicesForRegularTransfer();

    expect(invoiceRepository.find).toHaveBeenCalledWith({
      clientPaymentStatus: {
        $in: [ClientPaymentStatus.Pending, ClientPaymentStatus.Failed],
      },
      buyout: null,
      expedited: false,
      status: InvoiceStatus.Purchased,
      recordStatus: RecordStatus.Active,
    });
  });

  it('When fetching invoices for regular transfer, purchased invoices are included', async () => {
    await dataAccess.getInvoicesForRegularTransfer();
    const args = invoiceRepository.find.mock.calls[0][0];

    expect(args.status).toBe(InvoiceStatus.Purchased);
  });

  it('When fetching invoices for regular transfer, expedited invoices are included if option is enabled', async () => {
    await dataAccess.getInvoicesForRegularTransfer(true);
    const args = invoiceRepository.find.mock.calls[0][0];

    expect(args.expedited).toBeUndefined();
  });

  it('When fetching release of funds for regular transfer, reserves with release of funds reasons are included', async () => {
    const findSpy = jest.spyOn(reserveRepository, 'find');
    await dataAccess.getReleaseOfFunds();
    const args = findSpy.mock.calls[0][0];

    expect(args.reason).toBe(ReserveReason.ReleaseOfFunds);
  });

  it('When fetching release of funds for regular transfer, active reserves are included', async () => {
    const findSpy = jest.spyOn(reserveRepository, 'find');
    await dataAccess.getReleaseOfFunds();
    const args = findSpy.mock.calls[0][0];

    expect(args.payload).toStrictEqual({
      reversedByReserveId: null,
    });
  });

  it('When fetching release of funds for regular transfer, unpaid and failed reserves are included', async () => {
    const findSpy = jest.spyOn(reserveRepository, 'find');
    await dataAccess.getReleaseOfFunds();
    const args = findSpy.mock.calls[0][0];

    expect(args.reserveClientPayments).toStrictEqual({
      clientPayment: {
        $or: [
          {
            status: PaymentStatus.FAILED,
          },
          {
            status: null,
          },
        ],
      },
    });
  });

  describe('hasRecentTransfersInitiated', () => {
    const clientId = 'test-client-id';

    it('Should return true when recent expedite transfer exists', async () => {
      clientPaymentRepository.count.mockResolvedValue(1);

      const result = await dataAccess.hasRecentTransfersInitiated(clientId);

      expect(result).toBe(true);
    });

    it('Should return false when no recent transfers exist', async () => {
      clientPaymentRepository.count.mockResolvedValue(0);

      const result = await dataAccess.hasRecentTransfersInitiated(clientId);

      expect(result).toBe(false);
    });

    it('Should call clientPaymentRepository.count exactly once', async () => {
      clientPaymentRepository.count.mockResolvedValue(0);

      await dataAccess.hasRecentTransfersInitiated(clientId);

      expect(clientPaymentRepository.count).toHaveBeenCalledTimes(1);
    });
  });
});
