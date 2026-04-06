import { ValidationError, Validator } from '@core/validation';
import { ClientSuccessTeamRepository } from '@module-persistence/repositories';
import { Injectable } from '@nestjs/common';
import { ValidationInput } from './update-client-factoring-config-validation.service';

@Injectable()
export class ClientSuccessTeamChangeValidator
  implements Validator<ValidationInput>
{
  constructor(
    private clientSuccessTeamRepository: ClientSuccessTeamRepository,
  ) {}
  async validate(context: ValidationInput): Promise<void> {
    const { successTeamId } = context[0];
    if (!successTeamId) {
      return;
    }
    const currentSuccessTeamId = context[1].clientSuccessTeam.id;
    if (successTeamId === currentSuccessTeamId) {
      return;
    }
    const clientSuccessTeamEntity =
      await this.clientSuccessTeamRepository.findOneById(successTeamId);
    if (clientSuccessTeamEntity === null) {
      throw new ValidationError(
        'client-success-team-change',
        `Client success team with id ${successTeamId} does not exist.`,
      );
    }
  }
}
