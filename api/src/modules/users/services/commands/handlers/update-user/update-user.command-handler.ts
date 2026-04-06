import { AUTH0_SERVICE, Auth0Service } from '@module-auth';
import { UserEntity, UserRepository } from '@module-persistence';
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateUserCommand } from '../../update-user.command';
import { UpdateUserValidationService } from './validation';

@CommandHandler(UpdateUserCommand)
export class UpdateUserCommandHandler
  implements ICommandHandler<UpdateUserCommand, UserEntity>
{
  constructor(
    private userRepository: UserRepository,
    private validationService: UpdateUserValidationService,
    @Inject(AUTH0_SERVICE) private authService: Auth0Service,
  ) {}

  async execute({
    userId,
    request,
    externalServices: updateAuth0,
  }: UpdateUserCommand): Promise<UserEntity> {
    const user = await this.userRepository.getOneById(userId);
    await this.validationService.validate({ user, request });

    user.email = request.email;
    if (updateAuth0) {
      await this.authService.changeEmail(user.email, request.email);
    }
    return user;
  }
}
