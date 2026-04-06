import { ValidationService } from '@core/validation';
import { Injectable } from '@nestjs/common';
import { ClientBrokerAssignmentEntity } from '@module-persistence/entities';
import { NotPaidByBrokerValidator } from './not-paid-by-broker.validator';

@Injectable()
export class ReleaseValidationService extends ValidationService<ClientBrokerAssignmentEntity> {
  constructor(notPaidByBrokerValidator: NotPaidByBrokerValidator) {
    super([notPaidByBrokerValidator]);
  }
}
