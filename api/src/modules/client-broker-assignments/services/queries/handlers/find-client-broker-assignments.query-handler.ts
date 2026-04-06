import {
  ClientBrokerAssignmentEntity,
  ClientBrokerAssignmentRepository,
  ClientBrokerAssignmentStatus,
  RecordStatus,
} from '@module-persistence';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FindClientBrokerAssignmentsQuery } from '../find-client-broker-assignments.query';
import { FindClientBrokerAssignmentsQueryResult } from '../find-client-broker-assignments.query';
import { ObjectQuery } from '@mikro-orm/core';
import { UnknownClientBrokerAssignmentStatusError } from '../../errors';
import {
  ClientBrokerAssignmentStatusFilter,
  FindClientBrokerAssignmentsFilterCriteria,
} from './find-client-broker-assignments.filter-criteria';
import { BrokerService } from '@module-brokers';
import { FilterCriteria, FilterOperator, QueryCriteria } from '@core/data';

@QueryHandler(FindClientBrokerAssignmentsQuery)
export class FindClientBrokerAssignmentsQueryHandler
  implements
    IQueryHandler<
      FindClientBrokerAssignmentsQuery,
      FindClientBrokerAssignmentsQueryResult
    >
{
  constructor(
    private readonly clientBrokerAssignmentsRepository: ClientBrokerAssignmentRepository,
    private readonly brokerService: BrokerService,
  ) {}

  async execute(
    query: FindClientBrokerAssignmentsQuery,
  ): Promise<FindClientBrokerAssignmentsQueryResult> {
    const [entities, count] =
      await this.clientBrokerAssignmentsRepository.findByQueryCriteria(
        query.criteria,
        {
          additionalWhereClause: {
            recordStatus: RecordStatus.Active,
          },
          knownFilterCriteriaOptions: {
            constructor: FindClientBrokerAssignmentsFilterCriteria,
            whereClauseGenerator: (input) =>
              this.generateWhereClause(input, query.criteria),
          },
          populate: ['createdBy', 'updatedBy'],
        },
      );
    return { entities: entities, count };
  }

  async generateWhereClause(
    criteria: FindClientBrokerAssignmentsFilterCriteria,
    query: QueryCriteria,
  ): Promise<ObjectQuery<ClientBrokerAssignmentEntity>> {
    const whereClause: ObjectQuery<ClientBrokerAssignmentEntity> = {};
    if (criteria.status?.value) {
      switch (criteria.status.value) {
        case ClientBrokerAssignmentStatusFilter.IN_PROGRESS:
          whereClause['status'] = {
            [criteria.status.operator]: ClientBrokerAssignmentStatus.Sent,
          };
          break;
        case ClientBrokerAssignmentStatusFilter.VERIFIED:
          whereClause['status'] = {
            [criteria.status.operator]: ClientBrokerAssignmentStatus.Verified,
          };
          break;
        case ClientBrokerAssignmentStatusFilter.RELEASED:
          whereClause['status'] = {
            [criteria.status.operator]: ClientBrokerAssignmentStatus.Released,
          };
          break;
        default:
          throw new UnknownClientBrokerAssignmentStatusError(
            criteria.status.value,
          );
      }
    }
    if (criteria.brokerId?.value) {
      whereClause['brokerId'] = {
        [criteria.brokerId.operator]: criteria.brokerId.value,
      };
    }
    if (criteria.clientId?.value) {
      whereClause['clientId'] = {
        [criteria.clientId.operator]: criteria.clientId.value,
      };
    }

    if (criteria.legalName?.value) {
      const brokers = await this.brokerService.findAll(
        new QueryCriteria({
          ...query,
          filters: [
            new FilterCriteria({
              name: 'legalName',
              operator: FilterOperator.ILIKE,
              value: criteria.legalName.value,
            }),
          ],
        }),
      );
      whereClause['brokerId'] = {
        $in: brokers.items.map((broker) => broker.id),
      };
    }
    return whereClause;
  }
}
