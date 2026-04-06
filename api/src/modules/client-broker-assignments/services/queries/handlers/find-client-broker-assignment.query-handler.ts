import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FindClientBrokerAssignmentQuery } from '../find-client-broker-assignment.query';
import { ClientBrokerAssignmentRepository } from '@module-persistence/repositories';
import { EntityNotFoundError } from '@core/errors';
import { FindClientBrokerAssignmentQueryResult } from '../find-client-broker-assignment.query';

@QueryHandler(FindClientBrokerAssignmentQuery)
export class FindClientBrokerAssignmentQueryHandler
  implements
    IQueryHandler<
      FindClientBrokerAssignmentQuery,
      FindClientBrokerAssignmentQueryResult
    >
{
  constructor(
    private readonly clientBrokerAssignmentsRepository: ClientBrokerAssignmentRepository,
  ) {}

  async execute(
    query: FindClientBrokerAssignmentQuery,
  ): Promise<FindClientBrokerAssignmentQueryResult> {
    const clientBrokerAssignment =
      await this.clientBrokerAssignmentsRepository.findOneById(
        query.clientBrokerAssignmentId,
        {
          populate: ['assignmentHistory', 'assignmentHistory.changelogHistory'],
        },
      );
    if (!clientBrokerAssignment) {
      throw new EntityNotFoundError(
        `Could not find client broker assignment with id ${query.clientBrokerAssignmentId}`,
      );
    }
    return { entity: clientBrokerAssignment };
  }
}
