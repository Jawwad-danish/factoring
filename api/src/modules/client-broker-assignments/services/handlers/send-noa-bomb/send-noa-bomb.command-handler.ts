import { BrokerService, BrokerStatsDataAccess } from '@module-brokers';
import { ClientService } from '@module-clients';
import { NoticeOfAssignmentEmail } from '@module-email';
import { ClientBrokerAssignmentStatus } from '@module-persistence';
import { ClientBrokerAssignmentRepository } from '@module-persistence/repositories';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SendNoaBombCommand } from '../../commands';

@CommandHandler(SendNoaBombCommand)
export class SendNoaBombHandler
  implements ICommandHandler<SendNoaBombCommand, void>
{
  constructor(
    private readonly repository: ClientBrokerAssignmentRepository,
    private readonly brokerStatsDataAccess: BrokerStatsDataAccess,
    private readonly brokerService: BrokerService,
    private readonly clientService: ClientService,
    private readonly noaEmail: NoticeOfAssignmentEmail,
  ) {}

  async execute(command: SendNoaBombCommand): Promise<void> {
    const { clientId } = command;
    const client = await this.clientService.getOneById(clientId);
    const brokerIds = new Set<string>();

    const topBrokersStatsByAging =
      await this.brokerStatsDataAccess.getTopBrokersByAging();
    for (const stats of topBrokersStatsByAging) {
      brokerIds.add(stats.brokerId);
    }

    const [releasedAssignments] = await this.repository.findAll({
      clientId,
      status: ClientBrokerAssignmentStatus.Released,
    });
    for (const assignment of releasedAssignments) {
      brokerIds.add(assignment.brokerId);
    }

    const brokers = await this.brokerService.findByIds(Array.from(brokerIds));
    await this.noaEmail.sendBomb({ client, brokers });
  }
}
