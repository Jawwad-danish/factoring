import { BasicCommandHandler } from '@module-cqrs';
import { FirebaseTokenRepository } from '@module-persistence/repositories';
import { CommandHandler } from '@nestjs/cqrs';
import { RecordStatus } from '@module-persistence';
import { DeleteAllFirebaseTokensCommand } from '../delete-all-firebase-tokens.command';

@CommandHandler(DeleteAllFirebaseTokensCommand)
export class DeleteAllFirebaseTokensCommandHandler
  implements BasicCommandHandler<DeleteAllFirebaseTokensCommand>
{
  constructor(private readonly firebaseRepository: FirebaseTokenRepository) {}

  async execute(command: DeleteAllFirebaseTokensCommand): Promise<void> {
    const entities = await this.firebaseRepository.findTokensByUserId(
      command.userId,
    );
    for (const entity of entities) {
      entity.recordStatus = RecordStatus.Inactive;
    }
  }
}
