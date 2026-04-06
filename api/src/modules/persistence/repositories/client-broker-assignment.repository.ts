import { DatabaseService } from '@module-database';
import { ClientBrokerAssignmentEntity } from '@module-persistence/entities';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { QueryCriteriaRepository } from './basic-repository';
import { FilterOperator, SortingOrder } from '@core/data';
import { QueryCriteriaConfiguration } from './basic-repository';

@Injectable()
export class ClientBrokerAssignmentRepository extends QueryCriteriaRepository<ClientBrokerAssignmentEntity> {
  protected getQueryCriteriaConfiguration(): QueryCriteriaConfiguration<ClientBrokerAssignmentEntity> {
    return {
      sortableColumns: {
        createdAt: new Set([SortingOrder.ASC, SortingOrder.DESC]),
      },
      defaultSortableColumns: {
        createdAt: SortingOrder.DESC,
      },
      searchableColumns: {
        id: new Set([FilterOperator.EQ]),
        brokerId: new Set([FilterOperator.EQ]),
        clientId: new Set([FilterOperator.EQ]),
        status: new Set([FilterOperator.EQ]),
      },
      pagination: {
        maxItemsPerPage: 100,
      },
    };
  }

  constructor(@Inject(DatabaseService) databaseService: DatabaseService) {
    super(databaseService, ClientBrokerAssignmentEntity);
  }

  findOne(
    clientId: string,
    brokerId: string,
  ): Promise<ClientBrokerAssignmentEntity | null> {
    return this.repository.findOne({
      clientId: clientId,
      brokerId: brokerId,
    });
  }

  async getOne(
    clientId: string,
    brokerId: string,
  ): Promise<ClientBrokerAssignmentEntity> {
    const found = await this.findOne(clientId, brokerId);
    if (found === null) {
      throw new NotFoundException('Could not find assignment');
    }
    return found;
  }
}
