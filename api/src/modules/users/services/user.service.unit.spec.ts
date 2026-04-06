import { mockToken } from '@core/test';
import { CommandRunner } from '@module-cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeQuery, UpdateUserRequest } from '../data';
import { buildCreateEmployeeRequest, buildStubUserEntity } from '../tests';
import { CreateEmployeeCommand, UpdateUserCommand } from './commands';
import { UserService } from './user.service';
import { EmployeeRole } from '@module-persistence/entities';
import {
  EmployeeRepository,
  UserRepository,
} from '@module-persistence/repositories';
import { UserMapper } from '@module-common';
import { EntityStubs } from '@module-persistence/test';
import { EmployeeMapper } from '../data/mappers/employees.mapper';
import { AUTH0_SERVICE } from '@module-auth';

describe('UserService', () => {
  let userService: UserService;
  let commandRunner: CommandRunner;
  let userRepository: UserRepository;
  let employeeRepository: EmployeeRepository;
  let userMapper: UserMapper;
  let auth0Service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        EmployeeMapper,
        {
          provide: AUTH0_SERVICE,
          useValue: {
            requestChangePasswordEmail: jest.fn(),
          },
        },
      ],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    userService = module.get<UserService>(UserService);
    commandRunner = module.get(CommandRunner);
    userRepository = module.get(UserRepository);
    userMapper = module.get(UserMapper);
    employeeRepository = module.get(EmployeeRepository);
    auth0Service = module.get(AUTH0_SERVICE);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Should be defined', () => {
    expect(userService).toBeDefined();
  });

  it('Should update user email', async () => {
    const updateUserRequest: UpdateUserRequest = {
      email: 'faker@test.com',
    };

    const mockUserContext = buildStubUserEntity();

    const mockCommandRunnerSpy = jest
      .spyOn(commandRunner, 'run')
      .mockResolvedValue(mockUserContext);

    const result = await userService.update(
      mockUserContext.id,
      updateUserRequest,
    );

    expect(mockCommandRunnerSpy).toHaveBeenCalledWith(
      new UpdateUserCommand(mockUserContext.id, updateUserRequest),
    );
    expect(result).toEqual(mockUserContext);
  });

  it('should return user config if user is found', async () => {
    const mockUser = buildStubUserEntity();
    const mockUserResponse = {
      id: mockUser.id,
      externalId: mockUser.externalId,
      firstName: mockUser.firstName,
      lastName: mockUser.lastName,
      email: mockUser.email,
      createdAt: mockUser.createdAt,
      updatedAt: mockUser.updatedAt,
    };

    jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(mockUser);
    jest.spyOn(userMapper, 'entityToModel').mockResolvedValue(mockUserResponse);

    const result = await userService.getUserConfig('fakeEmail@example.com');

    expect(userRepository.findByEmail).toHaveBeenCalledWith(
      'fakeEmail@example.com',
    );
    expect(userMapper.entityToModel).toHaveBeenCalledWith(mockUser);
    expect(result).toEqual(mockUserResponse);
  });

  it('should return user by id if user is found', async () => {
    const mockUser = buildStubUserEntity();
    const mockUserResponse = {
      id: mockUser.id,
      externalId: mockUser.externalId,
      firstName: mockUser.firstName,
      lastName: mockUser.lastName,
      email: mockUser.email,
      createdAt: mockUser.createdAt,
      updatedAt: mockUser.updatedAt,
    };

    jest.spyOn(userRepository, 'getOneById').mockResolvedValueOnce(mockUser);
    jest
      .spyOn(userMapper, 'entityToModel')
      .mockResolvedValueOnce(mockUserResponse);

    const result = await userService.getUserById(mockUser.id);

    expect(userRepository.getOneById).toHaveBeenCalledWith(mockUser.id);
    expect(userMapper.entityToModel).toHaveBeenCalledWith(mockUser);
    expect(result).toEqual(mockUserResponse);
  });

  it('should create employee', async () => {
    const request = buildCreateEmployeeRequest({
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: EmployeeRole.Underwriter,
      extension: '123',
    });

    const employeeEntity = EntityStubs.buildEmployee();

    const mockCommandRunnerSpy = jest
      .spyOn(commandRunner, 'run')
      .mockResolvedValue(employeeEntity);

    const result = await userService.createEmployee(request);

    expect(mockCommandRunnerSpy).toHaveBeenCalledWith(
      new CreateEmployeeCommand(request),
    );
    expect(result.role).toEqual(employeeEntity.role);
    expect(result.extension).toEqual(employeeEntity.extension);
    expect(result.email).toEqual(employeeEntity.user.email);
    expect(result.firstName).toEqual(employeeEntity.user.firstName);
    expect(result.lastName).toEqual(employeeEntity.user.lastName);
  });

  it('should fetch the employees', async () => {
    const employeeEntity = EntityStubs.buildEmployee();

    const mockFindEmployeesSpy = jest
      .spyOn(employeeRepository, 'find')
      .mockResolvedValue([employeeEntity]);

    const result = await userService.getEmployees(new EmployeeQuery());

    expect(mockFindEmployeesSpy).toHaveBeenCalledTimes(1);
    expect(result.length).toBe(1);
    expect(result[0].role).toEqual(employeeEntity.role);
    expect(result[0].extension).toEqual(employeeEntity.extension);
    expect(result[0].email).toEqual(employeeEntity.user.email);
    expect(result[0].firstName).toEqual(employeeEntity.user.firstName);
    expect(result[0].lastName).toEqual(employeeEntity.user.lastName);
  });

  describe('sendResetEmployeePasswordRequest', () => {
    it('should send password reset email for employee user', async () => {
      const mockUser = buildStubUserEntity();
      const mockEmployee = EntityStubs.buildEmployee();
      mockEmployee.user = mockUser;

      jest
        .spyOn(employeeRepository, 'getOneById')
        .mockResolvedValue(mockEmployee);
      jest.spyOn(userRepository, 'getOneById').mockResolvedValue(mockUser);
      jest
        .spyOn(auth0Service, 'requestChangePasswordEmail')
        .mockResolvedValue(undefined);

      await userService.sendResetEmployeePasswordRequest(mockEmployee.id);

      expect(employeeRepository.getOneById).toHaveBeenCalledWith(
        mockEmployee.id,
      );
      expect(userRepository.getOneById).toHaveBeenCalledWith(mockUser.id);
      expect(auth0Service.requestChangePasswordEmail).toHaveBeenCalledWith(
        mockUser.email,
      );
    });

    it('should throw error if employee is not found', async () => {
      const employeeId = 'non-existent-employee-id';

      jest
        .spyOn(employeeRepository, 'getOneById')
        .mockRejectedValue(new Error('Employee not found'));

      await expect(
        userService.sendResetEmployeePasswordRequest(employeeId),
      ).rejects.toThrow('Employee not found');
    });
  });

  describe('sendResetPasswordRequest', () => {
    it('should send password reset email for user', async () => {
      const mockUser = buildStubUserEntity();

      jest.spyOn(userRepository, 'getOneById').mockResolvedValue(mockUser);
      jest
        .spyOn(auth0Service, 'requestChangePasswordEmail')
        .mockResolvedValue(undefined);

      await userService.sendResetPasswordRequest(mockUser.id);

      expect(userRepository.getOneById).toHaveBeenCalledWith(mockUser.id);
      expect(auth0Service.requestChangePasswordEmail).toHaveBeenCalledWith(
        mockUser.email,
      );
    });

    it('should throw error if user not found', async () => {
      jest
        .spyOn(userRepository, 'getOneById')
        .mockRejectedValue(new Error('User not found'));

      await expect(
        userService.sendResetPasswordRequest('non-existent-id'),
      ).rejects.toThrow('User not found');
    });
  });

  describe('validateUserIsNotEmployee', () => {
    it('should not throw error when user is not an employee', async () => {
      const mockUser = buildStubUserEntity();

      jest.spyOn(employeeRepository, 'findOneByUserId').mockResolvedValue(null);

      await expect(
        userService.validateUserIsNotEmployee(mockUser.id),
      ).resolves.not.toThrow();

      expect(employeeRepository.findOneByUserId).toHaveBeenCalledWith(
        mockUser.id,
      );
    });

    it('should throw error when user is an employee', async () => {
      const mockUser = buildStubUserEntity();
      const mockEmployee = EntityStubs.buildEmployee();

      jest
        .spyOn(employeeRepository, 'findOneByUserId')
        .mockResolvedValue(mockEmployee);

      await expect(
        userService.validateUserIsNotEmployee(mockUser.id),
      ).rejects.toThrow('User is an employee');
    });
  });
});
