import { mockToken } from '@core/test';
import { CommandRunner } from '@module-cqrs';
import {
  ClientFactoringConfigsRepository,
  ReserveRepository,
} from '@module-persistence/repositories';
import { Test, TestingModule } from '@nestjs/testing';
import { UUID } from '@core/uuid';
import {
  CreateReserveRequestBuilder,
  CreateRewardReserveRequestBuilder,
} from '../test';
import { CreateReserveCommand } from './commands';
import { ReservesService } from './reserve.service';
import { ReferralRockService } from '@module-common';
import { ClientFactoringConfigsEntity } from '@module-persistence';

describe('Reserve service', () => {
  let reserveRepository: ReserveRepository;
  let reserveService: ReservesService;
  let commandRunner: CommandRunner;
  let referralRockService: ReferralRockService;
  let clientFactoringConfigsRepository: ClientFactoringConfigsRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReservesService],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    reserveRepository = module.get(ReserveRepository);
    commandRunner = module.get(CommandRunner);
    referralRockService = module.get(ReferralRockService);
    reserveService = module.get(ReservesService);
    clientFactoringConfigsRepository = module.get(
      ClientFactoringConfigsRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Should be defined', () => {
    expect(reserveService).toBeDefined();
  });

  it('When creating a reserve, command is sent', async () => {
    const commandRunnerSpy = jest.spyOn(commandRunner, 'run');
    await reserveService.create(
      UUID.get(),
      CreateReserveRequestBuilder.releaseOfFundsTo3rdParty(),
    );

    expect(commandRunnerSpy.mock.calls[0][0]).toBeInstanceOf(
      CreateReserveCommand,
    );
  });

  it('When fetching reserve total, amount is retrieved', async () => {
    jest
      .spyOn(reserveRepository, 'getTotalByClient')
      .mockResolvedValueOnce(100);
    const result = await reserveService.getTotal(UUID.get());

    expect(result.toFixed()).toBe('100');
  });

  it('Create referral rock reward reserve', async () => {
    const rewardReserveRequest =
      CreateRewardReserveRequestBuilder.rewardReserveRequest();
    const clientId = UUID.get();
    const referralRockReward = {
      id: clientId,
      referralDisplayName: 'John',
    };
    const referralRockMember = {
      externalIdentifier: `clientId:${clientId}`,
    };

    jest
      .spyOn(referralRockService, 'getExistingRewardFromRefRock')
      .mockResolvedValueOnce(referralRockReward);

    jest
      .spyOn(referralRockService, 'getMemberDataFromRefRock')
      .mockResolvedValueOnce(referralRockMember);

    jest
      .spyOn(clientFactoringConfigsRepository, 'getOneByClientId')
      .mockResolvedValueOnce(new ClientFactoringConfigsEntity());

    const commandRunnerSpy = jest.spyOn(commandRunner, 'run');

    await reserveService.createRewardReserve(rewardReserveRequest);

    expect(commandRunnerSpy.mock.calls[0][0]).toBeInstanceOf(
      CreateReserveCommand,
    );
  });
});
