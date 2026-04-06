import { BasicCommandHandler } from '@module-cqrs';
import {
  FirebaseTokenRepository,
  UserRepository,
} from '@module-persistence/repositories';
import { CommandHandler } from '@nestjs/cqrs';
import { CreateFirebaseTokenCommand } from '../create-firebase-token.command';
import { FirebaseTokenMapper } from '../../../data';
import { RecordStatus } from '@module-persistence';

@CommandHandler(CreateFirebaseTokenCommand)
export class CreateFirebaseTokenCommandHandler
  implements BasicCommandHandler<CreateFirebaseTokenCommand>
{
  constructor(
    private readonly firebaseRepository: FirebaseTokenRepository,
    private readonly userRepository: UserRepository,
    private readonly firebaseTokenMapper: FirebaseTokenMapper,
  ) {}

  async execute({
    userId,
    request,
  }: CreateFirebaseTokenCommand): Promise<string> {
    let entity = await this.firebaseRepository.findOneByToken(
      request.firebaseDeviceToken,
      userId,
    );
    if (!entity) {
      const user = await this.userRepository.getOneById(userId);
      entity = this.firebaseTokenMapper.createRequestToEntity(request, user);
      this.firebaseRepository.persist(entity);
      return entity.id;
    }
    entity.recordStatus = RecordStatus.Active;
    return entity.id;
  }
}
