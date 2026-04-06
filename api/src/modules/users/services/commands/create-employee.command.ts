import { RequestCommand } from '@module-cqrs';
import { CreateEmployeeRequest } from '../../data';
import { EmployeeEntity } from '@module-persistence/entities';

export class CreateEmployeeCommand extends RequestCommand<
  CreateEmployeeRequest,
  EmployeeEntity
> {
  constructor(request: CreateEmployeeRequest) {
    super(request);
  }
}
