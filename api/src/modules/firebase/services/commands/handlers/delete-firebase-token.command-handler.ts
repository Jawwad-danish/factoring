import { BasicCommandHandler } from '@module-cqrs';
import { FirebaseTokenRepository } from '@module-persistence/repositories';
import { CommandHandler } from '@nestjs/cqrs';
import { RecordStatus } from '@module-persistence';
import { DeleteFirebaseTokenCommand } from '../delete-firebase-token.command';

@CommandHandler(DeleteFirebaseTokenCommand)
export class DeleteFirebaseTokenCommandHandler
  implements BasicCommandHandler<DeleteFirebaseTokenCommand>
{
  constructor(private readonly firebaseRepository: FirebaseTokenRepository) {}

  async execute(command: DeleteFirebaseTokenCommand): Promise<void> {
    const entity = await this.firebaseRepository.findOneByToken(
      command.token,
      command.userId,
    );
    if (entity) {
      entity.recordStatus = RecordStatus.Inactive;
    }
  }
}
