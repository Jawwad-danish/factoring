import { ValidationError, Validator } from '@core/validation';
import { UserRepository } from '@module-persistence';
import { Injectable } from '@nestjs/common';
import { ValidationInput } from './update-client-factoring-config-validation.service';

@Injectable()
export class ClientEmailChangeValidator implements Validator<ValidationInput> {
  constructor(private readonly userRepository: UserRepository) {}

  async validate(context: ValidationInput): Promise<void> {
    const { email } = context[0];
    if (!email) {
      return;
    }

    const user = await this.userRepository.findByEmail(email);
    if (user != null) {
      throw new ValidationError(
        'client-email-change',
        `Cannot update client email because the email already exists.`,
      );
    }
  }
}
