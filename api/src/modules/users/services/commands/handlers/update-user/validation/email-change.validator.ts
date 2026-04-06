import { ValidationError, Validator } from '@core/validation';
import { UserRepository } from '@module-persistence';
import { Injectable } from '@nestjs/common';
import { ValidationInput } from './update-user-validation.service';

@Injectable()
export class EmailChangeValidator implements Validator<ValidationInput> {
  constructor(private readonly userRepository: UserRepository) {}

  async validate({ request }: ValidationInput): Promise<void> {
    const user = await this.userRepository.findByEmail(request.email);
    if (user != null) {
      throw new ValidationError(
        'user-email-change',
        `Cannot update user email because the email already exists.`,
      );
    }
  }
}
