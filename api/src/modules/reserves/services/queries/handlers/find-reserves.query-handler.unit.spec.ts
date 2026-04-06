import { FilterOperator, QueryCriteria } from '@core/data';
import { mockMikroORMProvider, mockToken } from '@core/test';
import { ReserveReason } from '@module-persistence/entities';
import { ReserveRepository } from '@module-persistence/repositories';
import { Test, TestingModule } from '@nestjs/testing';
import { FindReservesQuery } from '../find-reserves.query';
import {
  FindReservesFilterCriteria,
  ReasonFilterCriteria,
  ReserveReasonFilter,
} from './find-reserves.filter-criteria';
import { FindReservesQueryHandler } from './find-reserves.query-handler';
import { EntityStubs } from '@module-persistence/test';

describe('Find Reserves Query Handler', () => {
  let queryHandler: FindReservesQueryHandler;
  let repository: ReserveRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FindReservesQueryHandler, mockMikroORMProvider],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    queryHandler = module.get(FindReservesQueryHandler);
    repository = module.get(ReserveRepository);
  });

  it('Should be defined', () => {
    expect(queryHandler).toBeDefined();
  });

  it('Reserve repository is called', async () => {
    const findByQueryCriteriaSpy = jest
      .spyOn(repository, 'findByQueryCriteria')
      .mockResolvedValueOnce([[EntityStubs.buildStubReserve()], 1]);
    await queryHandler.execute(
      new FindReservesQuery('123', new QueryCriteria()),
    );
    expect(findByQueryCriteriaSpy).toBeCalledTimes(1);
  });

  it(`Filter criteria with adjustments is generated corectly`, async () => {
    const filterCriteria = new FindReservesFilterCriteria({
      reason: new ReasonFilterCriteria({
        value: ReserveReasonFilter.Adjustment,
        operator: FilterOperator.EQ,
      }),
    });
    const result = await queryHandler.generateWhereClause(filterCriteria);

    expect(result['reason']).toEqual({
      $in: [
        ReserveReason.ReleaseOfFunds,
        ReserveReason.ReleaseToThirdParty,
        ReserveReason.NonFactoredPayment,
        ReserveReason.ClientCredit,
        ReserveReason.OverAdvance,
        ReserveReason.DirectPaymentByClient,
        ReserveReason.WriteOff,
        ReserveReason.Fee,
        ReserveReason.BrokerClaim,
        ReserveReason.BalanceTransferFromPositive,
        ReserveReason.BalanceTransferToPositive,
      ],
    });
  });
});
