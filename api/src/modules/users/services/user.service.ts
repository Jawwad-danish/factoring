import { User } from '@core/data';
import { CrossCuttingConcerns } from '@core/util';
import { UserMapper } from '@module-common';
import { CommandRunner } from '@module-cqrs';
import { Transactional } from '@module-database';
import {
  EmployeeRepository,
  UserRepository,
} from '@module-persistence/repositories';
import { RecordStatus } from '@module-persistence/entities';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  CreateEmployeeRequest,
  Employee,
  EmployeeQuery,
  UpdateUserRequest,
  UserContext,
} from '../data';
import { CreateEmployeeCommand, UpdateUserCommand } from './commands';
import { UpdateUserError } from './errors';
import { EmployeeMapper } from '../data/mappers/employees.mapper';
import { EntityNotFoundError } from '@core/errors';
import { AUTH0_SERVICE, Auth0Service } from '@module-auth';

@Injectable()
export class UserService {
  logger: Logger = new Logger(UserService.name);

  constructor(
    private commandRunner: CommandRunner,
    private userRepository: UserRepository,
    private userMapper: UserMapper,
    private employeeRepository: EmployeeRepository,
    private employeeMapper: EmployeeMapper,
    @Inject(AUTH0_SERVICE) private auth0Service: Auth0Service,
  ) {}

  @CrossCuttingConcerns({
    error: {
      errorSupplier: (cause, id: string) => new UpdateUserError(id, cause),
    },
    logging: (id: string) => {
      return {
        message: 'Update user',
        payload: {
          id,
        },
      };
    },
  })
  @Transactional('update-user')
  async update(id: string, request: UpdateUserRequest): Promise<UserContext> {
    return await this.commandRunner.run(new UpdateUserCommand(id, request));
  }

  async getUserConfig(email: string): Promise<User> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new EntityNotFoundError(`Could not find user by email ${email}`);
    }
    return await this.userMapper.entityToModel(user);
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.getOneById(id);
    return await this.userMapper.entityToModel(user);
  }

  async getEmployees(query: EmployeeQuery): Promise<Employee[]> {
    const employeeEntities = await this.employeeRepository.find(
      {
        role: query.role,
        recordStatus: RecordStatus.Active,
      },
      { populate: ['user'] },
    );
    return Promise.all(
      employeeEntities.map((entity) =>
        this.employeeMapper.entityToModel(entity),
      ),
    );
  }

  @Transactional('create-employee')
  async createEmployee(payload: CreateEmployeeRequest): Promise<Employee> {
    const entity = await this.commandRunner.run(
      new CreateEmployeeCommand(payload),
    );
    return this.employeeMapper.entityToModel(entity);
  }

  @CrossCuttingConcerns({
    logging: (employeeId: string) => {
      return {
        message: 'Send reset employee password request',
        payload: {
          employeeId,
        },
      };
    },
  })
  async sendResetEmployeePasswordRequest(employeeId: string): Promise<void> {
    const employee = await this.employeeRepository.getOneById(employeeId);
    await this.sendResetPasswordRequest(employee.user.id);
  }

  async sendResetPasswordRequest(userId: string): Promise<void> {
    const user = await this.userRepository.getOneById(userId);
    await this.auth0Service.requestChangePasswordEmail(user.email);
    this.logger.log(`Password reset email sent to ${user.email}`);
  }

  async validateUserIsNotEmployee(id: string): Promise<void> {
    const employee = await this.employeeRepository.findOneByUserId(id);
    if (employee) {
      this.logger.log(`User with id ${id} is an employee.`);
      throw new BadRequestException('User is an employee');
    }
  }
}
