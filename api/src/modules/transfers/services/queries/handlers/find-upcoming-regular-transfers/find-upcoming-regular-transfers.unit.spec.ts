import { mockToken } from '@core/test';
import { EntityStubs } from '@module-persistence/test';
import { InvoiceStatus } from '@module-persistence/entities';
import { Test, TestingModule } from '@nestjs/testing';
import Big from 'big.js';
import { UUID } from '@core/uuid';
import { FindUpcomingRegularTransfersQuery } from '../../find-upcoming-regular-transfers.query';
import { FindUpcomingRegularTransfersQueryHandler } from './find-upcoming-regular-transfers.query-handler';
import { TransferTimeService } from '@module-common';
import { TransferDataAccess } from '../../../commands';

describe('FindUpcomingRegularTransfersQueryHandler', () => {
  let transferTimeService: TransferTimeService;
  let transfersDataAccess: TransferDataAccess;
  let handler: FindUpcomingRegularTransfersQueryHandler;
  const transferTimes = {
    name: 'second_ach',
    cutoff: {
      hour: 17,
      minute: 0,
    },
    send: {
      hour: 19,
      minute: 0,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FindUpcomingRegularTransfersQueryHandler],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    transferTimeService = module.get(TransferTimeService);
    transfersDataAccess = module.get(TransferDataAccess);
    handler = module.get(FindUpcomingRegularTransfersQueryHandler);
  }, 60000);

  it('Should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('Query handler assignes values correctly', async () => {
    const id = UUID.get();
    jest.spyOn(transfersDataAccess, 'getReleaseOfFunds').mockResolvedValueOnce([
      EntityStubs.buildStubReserve({
        amount: new Big(-100),
        clientId: id,
      }),
      EntityStubs.buildStubReserve({
        amount: new Big(-350),
        clientId: id,
      }),
    ]);
    jest
      .spyOn(transfersDataAccess, 'expediteClients')
      .mockResolvedValueOnce([]);
    jest
      .spyOn(transfersDataAccess, 'getInvoicesForRegularTransfer')
      .mockResolvedValueOnce([
        EntityStubs.buildStubInvoice({
          clientId: id,
          status: InvoiceStatus.Purchased,
          accountsReceivableValue: new Big(10000),
          approvedFactorFee: new Big(0),
          reserveFee: new Big(0),
          deduction: new Big(0),
        }),
        EntityStubs.buildStubInvoice({
          clientId: id,
          status: InvoiceStatus.Purchased,
          accountsReceivableValue: new Big(10000),
          approvedFactorFee: new Big(0),
          reserveFee: new Big(0),
          deduction: new Big(0),
        }),
        EntityStubs.buildStubInvoice({
          clientId: id,
          status: InvoiceStatus.Purchased,
          accountsReceivableValue: new Big(10000),
          approvedFactorFee: new Big(50),
          reserveFee: new Big(50),
          deduction: new Big(50),
        }),
      ]);

    jest
      .spyOn(transferTimeService, 'getNextTransferTime')
      .mockReturnValue(new Date());
    jest
      .spyOn(transferTimeService, 'getLastTransferTimeOfTheDay')
      .mockReturnValue(transferTimes);
    jest
      .spyOn(transferTimeService, 'getCurrentTransferWindow')
      .mockReturnValue(transferTimes);

    const result = await handler.execute(
      new FindUpcomingRegularTransfersQuery(),
    );

    expect(result.clientAmounts[0].clientId).toBe(id);
    expect(result.purchasedInvoicesCount).toBe(3);
    expect(result.clientAmounts[0].fee.toNumber()).toBe(0);
    expect(result.clientAmounts[0].invoicesTotal.toNumber()).toBe(29850);
    expect(result.clientAmounts[0].reservesTotal.toNumber()).toBe(450);
    expect(result.clientAmounts[0].transferable.toNumber()).toBe(30300);
  });
});
