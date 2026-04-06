import { CommandRunner, QueryRunner } from '@module-cqrs';
import { Transactional } from '@module-database';
import { Injectable } from '@nestjs/common';
import {
  CreateClientBrokerAssignmentCommand,
  ReleaseClientBrokerAssignmentCommand,
  SendNoaBombCommand,
  SendNoaCommand,
} from './commands';
import { CreateClientDebtorAssignmentRequest } from '@fs-bobtail/factoring/data';
import {
  ReleaseBrokerRequest,
  ReleaseClientBrokerAssignmentResult,
  ClientBrokerAssignment,
} from '../data';
import { ClientBrokerAssignmentMapper } from '../mappers';
import { QueryCriteria } from '@core/data';
import { CrossCuttingConcerns } from '@core/util';
import {
  FindClientBrokerAssignmentQuery,
  FindClientBrokerAssignmentQueryResult,
  FindClientBrokerAssignmentsQuery,
  FindClientBrokerAssignmentsQueryResult,
} from './queries';
import { ClientBrokerAssignmentNotFoundError } from './errors';

const OBSERVABILITY_TAG = 'client-broker-assignment-service';

@Injectable()
export class ClientBrokerAssignmentService {
  constructor(
    private readonly commandRunner: CommandRunner,
    private readonly queryRunner: QueryRunner,
    private readonly mapper: ClientBrokerAssignmentMapper,
  ) {}

  @Transactional('client-broker-assignment-create')
  async create(
    payload: CreateClientDebtorAssignmentRequest,
  ): Promise<ClientBrokerAssignment> {
    const entity = await this.commandRunner.run(
      new CreateClientBrokerAssignmentCommand(payload),
    );
    return this.mapper.entityToModel(entity);
  }

  @Transactional('client-broker-assignment-release')
  release(
    payload: ReleaseBrokerRequest,
  ): Promise<ReleaseClientBrokerAssignmentResult> {
    return this.commandRunner.run(
      new ReleaseClientBrokerAssignmentCommand(payload),
    );
  }

  sendNoaBomb(clientId: string) {
    return this.commandRunner.run(new SendNoaBombCommand(clientId));
  }

  reSendNoa(id: string, to: string) {
    return this.commandRunner.run(new SendNoaCommand({ id, to }));
  }

  @CrossCuttingConcerns<ClientBrokerAssignmentService, 'findAll'>({
    logging: (criteria: QueryCriteria) => {
      return {
        message: `Fetching all client broker assignments`,
        payload: {
          criteria,
        },
      };
    },
  })
  async findAll(
    criteria: QueryCriteria,
  ): Promise<FindClientBrokerAssignmentsQueryResult> {
    return this.queryRunner.run(new FindClientBrokerAssignmentsQuery(criteria));
  }

  @CrossCuttingConcerns({
    error: {
      errorSupplier: (cause: Error, id: string) =>
        new ClientBrokerAssignmentNotFoundError(id, cause),
    },
    logging: (id: string) => {
      return {
        message: 'Getting client broker assignment by id',
        payload: {
          clientBrokerAssignmentId: id,
        },
      };
    },
    observability: {
      tag: [OBSERVABILITY_TAG, 'get-by-id'],
    },
  })
  async getOneById(id: string): Promise<FindClientBrokerAssignmentQueryResult> {
    return this.queryRunner.run(new FindClientBrokerAssignmentQuery(id));
  }
}
