import { DataMapper } from '@core/mapping';
import { UserMapper } from '@module-common';
import { ClientBrokerAssignmentEntity } from '@module-persistence';
import { Injectable } from '@nestjs/common';
import {
  AssignmentsChangelogHistory,
  ClientBrokerAssignment,
  ClientBrokerAssignmentHistory,
} from '../data';
import { DataMapperUtil } from '@common/mappers';

@Injectable()
export class ClientBrokerAssignmentMapper
  implements DataMapper<ClientBrokerAssignmentEntity, ClientBrokerAssignment>
{
  constructor(private readonly userMapper: UserMapper) {}
  async entityToModel(
    entity: ClientBrokerAssignmentEntity,
  ): Promise<ClientBrokerAssignment> {
    const clientBrokerAssignment = new ClientBrokerAssignment();
    clientBrokerAssignment.id = entity.id;
    clientBrokerAssignment.clientId = entity.clientId;
    clientBrokerAssignment.brokerId = entity.brokerId;
    clientBrokerAssignment.recordStatus = entity.recordStatus;
    clientBrokerAssignment.status = entity.status;
    clientBrokerAssignment.createdAt = entity.createdAt;
    clientBrokerAssignment.updatedAt = entity.updatedAt;
    clientBrokerAssignment.createdBy = await this.userMapper.createdByToModel(
      entity,
    );
    clientBrokerAssignment.updatedBy = await this.userMapper.updatedByToModel(
      entity,
    );
    if (entity.assignmentHistory.isInitialized()) {
      clientBrokerAssignment.assignmentsHistory =
        await DataMapperUtil.asyncMapCollections(
          entity.assignmentHistory,
          async (item) => {
            const clientBrokerAssignmentHistory =
              new ClientBrokerAssignmentHistory({
                id: item.id,
                note: item.note,
                changelogNotes: item.changelogNotes,
                status: item.status,
                createdAt: item.createdAt,
              });
            if (item.changelogHistory.isInitialized()) {
              clientBrokerAssignmentHistory.assignmentsChangelogHistory =
                await DataMapperUtil.asyncMapCollections(
                  item.changelogHistory,
                  async (changelog) => {
                    const assignmentsChangelogHistory =
                      new AssignmentsChangelogHistory({
                        id: changelog.id,
                        changelogNotes: changelog.changelogNotes,
                        description: changelog.description,
                        createdAt: changelog.createdAt,
                      });
                    return assignmentsChangelogHistory;
                  },
                );
            }
            return clientBrokerAssignmentHistory;
          },
        );
    }
    return clientBrokerAssignment;
  }
}
