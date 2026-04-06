import { ClientService } from '@module-clients';
import { CommandRunner } from '@module-cqrs';
import { GenerateReleaseLetterCommand } from '@module-document-generation';
import {
  ClientBrokerAssignmentAssocEntity,
  ClientBrokerAssignmentEntity,
  ClientBrokerAssignmentStatus,
} from '@module-persistence/entities';
import { ClientBrokerAssignmentRepository } from '@module-persistence/repositories';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ReleaseClientBrokerAssignmentCommand } from '../../commands';
import { ReleaseClientBrokerAssignmentResult } from '../../../data';
import { ReleaseValidationService } from './validation';

const SKIP_RELEASE_LETTER = true;

@CommandHandler(ReleaseClientBrokerAssignmentCommand)
export class ReleaseClientBrokerAssignmentHandler
  implements
    ICommandHandler<
      ReleaseClientBrokerAssignmentCommand,
      ReleaseClientBrokerAssignmentResult
    >
{
  constructor(
    private readonly repository: ClientBrokerAssignmentRepository,
    private readonly validationService: ReleaseValidationService,
    private readonly clientService: ClientService,
    private readonly commandRunner: CommandRunner,
  ) {}

  async execute(
    command: ReleaseClientBrokerAssignmentCommand,
  ): Promise<ReleaseClientBrokerAssignmentResult> {
    const { clientId, brokerId } = command.request;
    const client = await this.clientService.getOneById(clientId);
    const assignment = await this.repository.getOne(clientId, brokerId);
    await this.validationService.validate(assignment);
    this.assignReleaseStatus(assignment);
    let releaseLetterUrl = '';
    if (!SKIP_RELEASE_LETTER) {
      const result = await this.commandRunner.run(
        new GenerateReleaseLetterCommand(client),
      );
      releaseLetterUrl = result.url;
    }
    return new ReleaseClientBrokerAssignmentResult(
      assignment.status,
      releaseLetterUrl,
    );
  }

  private assignReleaseStatus(assignment: ClientBrokerAssignmentEntity) {
    assignment.status = ClientBrokerAssignmentStatus.Released;
    const history = new ClientBrokerAssignmentAssocEntity();
    history.status = ClientBrokerAssignmentStatus.Released;
    assignment.assignmentHistory.add(history);
  }
}
