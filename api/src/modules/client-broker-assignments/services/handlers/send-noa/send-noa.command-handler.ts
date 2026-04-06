import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { SendNoaCommand } from '../../commands';
import { ClientBrokerAssignmentRepository } from '@module-persistence/repositories';
import { NoticeOfAssignmentEmail } from '@module-email';
import { BrokerService } from '@module-brokers';
import { ClientService } from '@module-clients';

@CommandHandler(SendNoaCommand)
export class SendNoaHandler implements ICommandHandler<SendNoaCommand, void> {
  private readonly logger = new Logger(SendNoaHandler.name);

  constructor(
    private readonly repository: ClientBrokerAssignmentRepository,
    private readonly brokerService: BrokerService,
    private readonly clientService: ClientService,
    private readonly noaEmail: NoticeOfAssignmentEmail,
  ) {}

  async execute(command: SendNoaCommand): Promise<void> {
    const { id, to } = command.request;
    this.logger.log('Send NOA email requested', {
      clientBrokerAssignmentId: id,
      to,
    });

    try {
      const clientDebtorAssignment = await this.repository.getOneById(id);
      this.logger.debug('Loaded client broker assignment', {
        clientBrokerAssignmentId: id,
        clientId: clientDebtorAssignment.clientId,
        brokerId: clientDebtorAssignment.brokerId,
      });

      const client = await this.clientService.getOneById(
        clientDebtorAssignment.clientId,
      );
      const broker = await this.brokerService.getOneById(
        clientDebtorAssignment.brokerId,
      );

      await this.noaEmail.send({ client, broker, to });

      this.logger.log('Send NOA email succeeded', {
        clientBrokerAssignmentId: id,
        clientId: clientDebtorAssignment.clientId,
        brokerId: clientDebtorAssignment.brokerId,
        to,
      });
    } catch (error) {
      this.logger.error('Send NOA email failed', {
        clientBrokerAssignmentId: id,
        to,
        error,
      });
      throw error;
    }
  }
}
