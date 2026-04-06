import { PageResult, PaginationResult, QueryCriteria } from '@core/data';
import { formatToDollars } from '@core/formatting';
import { penniesToDollars } from '@core/formulas';
import { CrossCuttingConcerns } from '@core/util';
import { ReferralRockService } from '@module-common';
import { CommandRunner, QueryRunner } from '@module-cqrs';
import { Transactional } from '@module-database';
import { ReserveEntity, ReserveReason } from '@module-persistence';
import {
  ClientFactoringConfigsRepository,
  ReserveRepository,
} from '@module-persistence/repositories';
import { Injectable } from '@nestjs/common';
import Big from 'big.js';
import {
  CreateReserveFromReferralRockRequest,
  CreateReserveRequest,
  DeleteReserveRequest,
  ReserveMapper,
} from '../data';
import { CreateReserveCommand, DeleteReserveCommand } from './commands';
import {
  CreateReserveError,
  CreateRewardReserveError,
  GetTotalReservesError,
} from './errors';
import { FindReserveQuery, FindReservesQuery } from './queries';

@Injectable()
export class ReservesService {
  constructor(
    private readonly commandRunner: CommandRunner,
    private readonly queryRunner: QueryRunner,
    private readonly repository: ReserveRepository,
    private readonly clientRepository: ClientFactoringConfigsRepository,
    private readonly referralRockService: ReferralRockService,
    private readonly reserveMapper: ReserveMapper,
  ) {}

  @CrossCuttingConcerns({
    error: {
      errorSupplier: (error, clientId: string) =>
        new CreateReserveError(clientId, error),
    },
    logging: (clientId: string, request: CreateReserveRequest) => {
      return {
        message: 'Creating reserve',
        payload: {
          clientId,
          type: request.payload.payloadType,
          amount: formatToDollars(penniesToDollars(request.amount)),
        },
      };
    },
  })
  @Transactional('create-reserve')
  create(clientId: string, request: CreateReserveRequest) {
    return this.commandRunner.run(new CreateReserveCommand(clientId, request));
  }

  @CrossCuttingConcerns({
    error: {
      errorSupplier: (error, clientId: string) =>
        new CreateReserveError(clientId, error),
    },
    logging: (request: CreateReserveFromReferralRockRequest) => {
      return {
        message: 'Creating reserve from referral rock',
        payload: {
          referralId: request.Id,
          amount: formatToDollars(new Big(request.Amount)),
        },
      };
    },
  })
  @Transactional('create-referral-rock-reward-reserve')
  async createRewardReserve(request: CreateReserveFromReferralRockRequest) {
    const existingReward =
      await this.referralRockService.getExistingRewardFromRefRock(request);

    if (!existingReward) {
      const message = `reward ID ${request.Id} does not exist in referral rock`;
      throw new CreateRewardReserveError(message);
    }

    const memberData = await this.referralRockService.getMemberDataFromRefRock(
      request,
    );

    if (!memberData) {
      const message = `member ID ${request.MemberId} does not exist in referral rock`;
      throw new CreateRewardReserveError(message);
    }

    const existingReserve = await this.repository.findOne({
      clientId: this.referralRockService.externalIdToClientId(
        memberData.externalIdentifier,
      ),
      reason: ReserveReason.ClientCredit,
      note: {
        $ilike: `%${existingReward.id}%`,
      },
    });

    if (existingReserve) {
      const message = `new balance request from referral rock already exists in our DB note: ${existingReserve.note}`;
      throw new CreateRewardReserveError(message);
    }
    const clientConfig = await this.clientRepository.getOneByClientId(
      this.referralRockService.externalIdToClientId(
        memberData.externalIdentifier,
      ),
    );

    try {
      const createReserveRequest =
        await this.reserveMapper.mapReferralRewardToReserveRequest(
          request.Amount,
          existingReward.referralDisplayName,
          existingReward.id,
        );

      return this.commandRunner.run(
        new CreateReserveCommand(clientConfig.clientId, createReserveRequest),
      );
    } catch (err) {
      const message = `error creating balance for reward ID ${existingReward.id}`;
      throw new CreateRewardReserveError(message, err);
    }
  }

  @CrossCuttingConcerns({
    error: {
      errorSupplier: (error, clientId: string) =>
        new CreateReserveError(clientId, error),
    },
    logging: (clientId: string, reserveId: string) => {
      return {
        message: 'Deleting reserve',
        payload: {
          clientId,
          reserveId,
        },
      };
    },
  })
  @Transactional('delete-reserve')
  delete(clientId: string, reserveId: string, request: DeleteReserveRequest) {
    return this.commandRunner.run(
      new DeleteReserveCommand(clientId, reserveId, request),
    );
  }

  @CrossCuttingConcerns({
    error: {
      errorSupplier: (error, clientId: string) =>
        new GetTotalReservesError(clientId, error),
    },
    logging: (clientId: string) => {
      return {
        message: 'Fetching reserve total',
        payload: {
          clientId,
        },
      };
    },
  })
  async getTotal(clientId: string): Promise<Big> {
    const total = await this.repository.getTotalByClient(clientId);
    return new Big(total);
  }

  @CrossCuttingConcerns<ReservesService, 'findAll'>({
    logging: (clientId: string, criteria: QueryCriteria) => {
      return {
        message: `Fetching all reserves for client ${clientId}`,
        payload: {
          clientId,
          criteria,
        },
      };
    },
  })
  async findAll(
    clientId: string,
    criteria: QueryCriteria,
  ): Promise<[PageResult<ReserveEntity>, number]> {
    const queryResult = await this.queryRunner.run(
      new FindReservesQuery(clientId, criteria),
    );

    return [
      new PageResult(
        queryResult.entities,
        new PaginationResult(
          criteria.page.page,
          criteria.page.limit,
          queryResult.totalCount,
        ),
      ),
      queryResult.totalAmount,
    ];
  }

  @CrossCuttingConcerns<ReservesService, 'findOne'>({
    logging: (clientId: string, reserveId: string) => {
      return {
        message: `Fetching reserve ${reserveId} for client ${clientId}`,
        payload: {
          clientId,
          reserveId,
        },
      };
    },
  })
  async findOne(
    clientId: string,
    reserveId: string,
  ): Promise<[ReserveEntity, number]> {
    const queryResult = await this.queryRunner.run(
      new FindReserveQuery(clientId, reserveId),
    );
    return [queryResult.reserve, queryResult.totalAmount];
  }
}
