import { mockToken } from '@core/test';
import { AUTH0_SERVICE, Auth0Service } from '@module-auth';
import { UserRepository } from '@module-persistence';
import { buildStubUserEntity } from '@module-users/test';
import { Test, TestingModule } from '@nestjs/testing';
import { UpdateUserRequest } from '../../../../data';
import { UpdateUserCommand } from '../../update-user.command';
import { UpdateUserCommandHandler } from './update-user.command-handler';

describe('UpdateUserCommandHandler', () => {
  let userRepository: UserRepository;
  let auth0Service: Auth0Service;
  let handler: UpdateUserCommandHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UpdateUserCommandHandler],
    })
      .useMocker((token) => {
        if (token === AUTH0_SERVICE) {
          return {
            refreshToken: jest.fn(),
            clientCredentialsGrant: jest.fn(),
            changeEmail: jest.fn(),
          };
        }
        return mockToken(token);
      })
      .compile();

    auth0Service = module.get(AUTH0_SERVICE);
    userRepository = module.get(UserRepository);
    handler = module.get(UpdateUserCommandHandler);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should update external services', async () => {
    const mockUser = buildStubUserEntity();

    const mockFindUserByIdSpy = jest
      .spyOn(userRepository, 'getOneById')
      .mockResolvedValue(mockUser);
    const changeEmailSpy = jest.spyOn(auth0Service, 'changeEmail');

    const command = new UpdateUserCommand(
      mockUser.id,
      new UpdateUserRequest({
        email: 'faker@test.com',
      }),
      true,
    );

    const result = await handler.execute(command);

    expect(mockFindUserByIdSpy).toHaveBeenCalledWith(mockUser.id);
    expect(mockUser.email).toBe('faker@test.com');
    expect(changeEmailSpy).toBeCalledTimes(1);
    expect(result).toEqual(mockUser);
  });

  it('should update user', async () => {
    const mockUser = buildStubUserEntity();

    const mockFindUserByIdSpy = jest
      .spyOn(userRepository, 'getOneById')
      .mockResolvedValue(mockUser);

    const command = new UpdateUserCommand(
      mockUser.id,
      new UpdateUserRequest({
        email: 'faker@test.com',
      }),
    );

    const result = await handler.execute(command);

    expect(mockFindUserByIdSpy).toHaveBeenCalledWith(mockUser.id);
    expect(mockUser.email).toBe('faker@test.com');
    expect(result).toEqual(mockUser);
  });
});
