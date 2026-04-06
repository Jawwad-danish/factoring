import { mockToken } from '@core/test';
import { InvoiceStatus } from '@module-persistence/entities';
import { Test, TestingModule } from '@nestjs/testing';
import Big from 'big.js';
import { UUID } from '@core/uuid';
import { FindUpcomingExpediteTransfersQuery } from '../../find-upcoming-expedite-transfers.query';
import { FindUpcomingExpediteTransfersQueryHandler } from './find-upcoming-expedite-transfers.query-handler';
import { ClientFactoringConfigsRepository } from '@module-persistence';
import { EntityStubs } from '@module-persistence/test';
import { ExpediteConfigurer } from '@module-common';
import { TransferDataAccess } from '../../../commands';
import { ClientService } from '@module-clients';
import { RtpSupportService } from '@module-rtp';
import { buildStubClient } from '@module-clients/test';

describe('FindUpcomingExpediteTransfersQueryHandler', () => {
  let expediteConfigurer: ExpediteConfigurer;
  let transfersDataAccess: TransferDataAccess;
  let handler: FindUpcomingExpediteTransfersQueryHandler;
  let clientFactoringConfigRepository: ClientFactoringConfigsRepository;
  let clientService: ClientService;
  let rtpSupportService: RtpSupportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FindUpcomingExpediteTransfersQueryHandler],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    expediteConfigurer = module.get(ExpediteConfigurer);
    transfersDataAccess = module.get(TransferDataAccess);
    handler = module.get(FindUpcomingExpediteTransfersQueryHandler);
    clientFactoringConfigRepository = module.get(
      ClientFactoringConfigsRepository,
    );
    clientService = module.get(ClientService);
    rtpSupportService = module.get(RtpSupportService);
  }, 60000);

  it('Should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('Query handler assignes values correctly', async () => {
    const id = UUID.get();
    jest
      .spyOn(transfersDataAccess, 'expediteClients')
      .mockResolvedValueOnce([id]);
    jest
      .spyOn(transfersDataAccess, 'getInvoicesForExpediteTransfer')
      .mockResolvedValueOnce([
        EntityStubs.buildStubInvoice({
          clientId: id,
          status: InvoiceStatus.UnderReview,
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

    // Ensure client filtering based on wire/RTP support passes this client
    const client = buildStubClient({ id });
    jest.spyOn(clientService, 'findByIds').mockResolvedValueOnce([client]);

    // Single batched RTP verification call should return a string array
    jest.spyOn(rtpSupportService, 'verifyAccounts').mockResolvedValueOnce([]);

    jest
      .spyOn(expediteConfigurer, 'expediteFee')
      .mockReturnValue(new Big(1800));
    jest
      .spyOn(clientFactoringConfigRepository, 'findByClientIds')
      .mockReturnValue(
        Promise.resolve([
          EntityStubs.buildClientFactoringConfig({
            clientId: id,
            doneSubmittingInvoices: true,
          }),
        ]),
      );

    const result = await handler.execute(
      new FindUpcomingExpediteTransfersQuery(),
    );

    expect(result.length).toBe(1);
    expect(result[0].clientId).toBe(id);
    expect(result[0].purchasedInvoicesCount).toBe(2);
    expect(result[0].underReviewInvoicesCount).toBe(1);
    expect(result[0].amount.fee.toNumber()).toBe(1800);
    expect(result[0].amount.invoicesTotal.toNumber()).toBe(19850);
    expect(result[0].amount.transferable.toNumber()).toBe(18050);
    expect(result[0].doneSubmittingInvoices).toBe(true);
  });
});
