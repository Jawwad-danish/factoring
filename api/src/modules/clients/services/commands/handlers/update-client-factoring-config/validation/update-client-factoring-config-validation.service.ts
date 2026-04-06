import { ValidationService } from '@core/validation';
import { ClientFactoringConfigsEntity } from '@module-persistence/entities';
import { Injectable } from '@nestjs/common';
import { UpdateClientFactoringConfigRequest } from '../../../../../data';
import { ClientEmailChangeValidator } from './client-email-change.validator';
import { ClientStatusChangeValidator } from './client-status-change.validator';
import { ClientSuccessTeamChangeValidator } from './client-success-team-change.validator';

export type ValidationInput = [
  UpdateClientFactoringConfigRequest,
  ClientFactoringConfigsEntity,
];

@Injectable()
export class UpdateClientFactoringConfigValidationService extends ValidationService<ValidationInput> {
  constructor(
    clientStatusChangeValidator: ClientStatusChangeValidator,
    clientSuccessTeamChangeValidator: ClientSuccessTeamChangeValidator,
    clientEmailChangeValidator: ClientEmailChangeValidator,
  ) {
    super([
      clientStatusChangeValidator,
      clientSuccessTeamChangeValidator,
      clientEmailChangeValidator,
    ]);
  }
}
