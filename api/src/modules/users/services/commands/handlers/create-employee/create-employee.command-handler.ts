import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateEmployeeCommand } from '../../create-employee.command';
import { EmployeeEntity } from '@module-persistence/entities';
import { EmployeeRepository } from '@module-persistence/repositories';
import { EmployeeMapper } from '../../../../data';

@CommandHandler(CreateEmployeeCommand)
export class CreateEmployeeCommandHandler
  implements ICommandHandler<CreateEmployeeCommand, EmployeeEntity>
{
  constructor(
    private readonly employeeMapper: EmployeeMapper,
    private readonly employeeRepository: EmployeeRepository,
  ) {}

  async execute({ request }: CreateEmployeeCommand): Promise<EmployeeEntity> {
    const entity = this.employeeMapper.createRequestToEntity(request);
    this.employeeRepository.persist(entity);
    return entity;
  }
}
