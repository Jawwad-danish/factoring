import { Test, TestingModule } from '@nestjs/testing';
import { CreateEmployeeCommandHandler } from './create-employee.command-handler';
import { mockToken } from '@core/test';
import { EmployeeRepository } from '@module-persistence/repositories';
import { buildCreateEmployeeRequest } from '@module-users/test';
import { CreateEmployeeCommand } from '../../create-employee.command';
import { EmployeeRole } from '@module-persistence';
import { EmployeeMapper } from '@module-users';
import { EntityStubs } from '@module-persistence/test';

describe('CreateEmployeeCommandHandler', () => {
  let handler: CreateEmployeeCommandHandler;
  let employeeRepository: EmployeeRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CreateEmployeeCommandHandler, EmployeeMapper],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    handler = module.get(CreateEmployeeCommandHandler);
    employeeRepository = module.get(EmployeeRepository);
  });

  it('Should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('Should create employee', async () => {
    const request = buildCreateEmployeeRequest({
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: EmployeeRole.Underwriter,
      extension: '123',
    });

    const employeeEntity = EntityStubs.buildEmployee();

    const mockCreateEmployee = jest
      .spyOn(employeeRepository, 'persist')
      .mockReturnValue(employeeEntity);

    const result = await handler.execute(new CreateEmployeeCommand(request));

    expect(result.role).toBe(request.role);
    expect(result.extension).toBe(request.extension);
    expect(result.user.email).toBe(request.email);
    expect(result.user.firstName).toBe(request.firstName);
    expect(result.user.lastName).toBe(request.lastName);
    expect(mockCreateEmployee).toBeCalledTimes(1);
  });
});
