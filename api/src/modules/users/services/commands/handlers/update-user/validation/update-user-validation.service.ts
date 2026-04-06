import { ValidationService } from '@core/validation';
import { UserEntity } from '@module-persistence/entities';
import { Injectable } from '@nestjs/common';
import { UpdateUserRequest } from '../../../../../data';
import { EmailChangeValidator } from './email-change.validator';

export type ValidationInput = {
  user: UserEntity;
  request: UpdateUserRequest;
};

@Injectable()
export class UpdateUserValidationService extends ValidationService<ValidationInput> {
  constructor(emailChangeValidator: EmailChangeValidator) {
    super([emailChangeValidator]);
  }
}
