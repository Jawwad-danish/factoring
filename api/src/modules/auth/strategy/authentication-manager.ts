import { Authentication, Authority, Principal } from '@core/app-context';
import { UserEntity } from '@module-persistence/entities';
import { UserRepository } from '@module-persistence/repositories';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthenticationManager {
  constructor(private readonly userRepository: UserRepository) {}

  async build(externalId: string, email: string, permissions: string[]) {
    let user = await this.userRepository.findByEmail(email);
    if (user == null) {
      const names = email.substring(0, email.indexOf('@')).split('.');
      user = new UserEntity();
      user.externalId = externalId;
      user.email = email;
      user.firstName = names[0] || null;
      user.lastName = names[1] || null;
      await this.userRepository.persistAndFlush(user);
    }

    return new Authentication(
      new Principal(user.id, email),
      new Authority(permissions),
    );
  }
}
