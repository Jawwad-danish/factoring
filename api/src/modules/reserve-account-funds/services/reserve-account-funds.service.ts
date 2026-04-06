import { QueryCriteria } from '@core/data';
import { penniesToDollars } from '@core/formulas';
import { CrossCuttingConcerns, formatToDollars } from '@core/util';
import { CommandRunner, QueryRunner } from '@module-cqrs';
import { Transactional } from '@module-database';
import { ReserveAccountFundsEntity } from '@module-persistence/entities';
import { Injectable } from '@nestjs/common';
import { CreateReserveAccountFundsRequest } from '../data';
import { CreateReserveAccountFundsCommand } from './commands';
import {
  CreateReserveAccountFundsError,
  GetReserveAccountFundsTotalError,
} from './errors';
import { FindReserveAccountFundsQuery } from './queries';
import { ReserveAccountFundsRepository } from '@module-persistence';
import Big from 'big.js';

@Injectable()
export class ReserveAccountFundsService {
  constructor(
    private readonly commandRunner: CommandRunner,
    private readonly queryRunner: QueryRunner,
    private readonly repository: ReserveAccountFundsRepository,
  ) {}

  @CrossCuttingConcerns<ReserveAccountFundsService, 'create'>({
    error: {
      errorSupplier: (error, clientId: string) =>
        new CreateReserveAccountFundsError(clientId, error),
    },
    logging: (clientId: string, request: CreateReserveAccountFundsRequest) => {
      return {
        message: 'Creating reserve account funds',
        payload: {
          clientId,
          amount: formatToDollars(penniesToDollars(request.amount)),
        },
      };
    },
  })
  @Transactional('create-reserve-account-funds')
  create(clientId: string, request: CreateReserveAccountFundsRequest) {
    return this.commandRunner.run(
      new CreateReserveAccountFundsCommand(clientId, request),
    );
  }

  @CrossCuttingConcerns<ReserveAccountFundsService, 'findAll'>({
    logging: (clientId: string, criteria: QueryCriteria) => {
      return {
        message: `Fetching all reserve account funds for client ${clientId}`,
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
  ): Promise<[ReserveAccountFundsEntity[], number]> {
    const queryResult = await this.queryRunner.run(
      new FindReserveAccountFundsQuery(clientId, criteria),
    );

    return [queryResult.entities, queryResult.totalCount];
  }

  @CrossCuttingConcerns({
    error: {
      errorSupplier: (error, clientId: string) =>
        new GetReserveAccountFundsTotalError(clientId, error),
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
    const total = await this.repository.getTotalForClient(clientId);
    return new Big(total);
  }
}
