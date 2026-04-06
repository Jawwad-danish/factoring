import { EntityNotFoundError } from '@core/errors';
import { mockToken } from '@core/test';
import { EntityStubs } from '@module-persistence';
import { RecordStatus } from '@module-persistence/entities';
import {
  FirebaseTokenRepository,
  UserRepository,
} from '@module-persistence/repositories';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateFirebaseTokenRequest, FirebaseTokenMapper } from '../../../data';
import { CreateFirebaseTokenCommand } from '../create-firebase-token.command';
import { CreateFirebaseTokenCommandHandler } from './create-firebase-token.command-handler';
import { CreateFirebaseTokenRequestBuilder } from '@module-firebase/test';

describe('CreateFirebaseTokenCommandHandler', () => {
  let handler: CreateFirebaseTokenCommandHandler;
  let firebaseRepository: FirebaseTokenRepository;
  let userRepository: UserRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CreateFirebaseTokenCommandHandler, FirebaseTokenMapper],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    handler = module.get<CreateFirebaseTokenCommandHandler>(
      CreateFirebaseTokenCommandHandler,
    );
    firebaseRepository = module.get<FirebaseTokenRepository>(
      FirebaseTokenRepository,
    );
    userRepository = module.get<UserRepository>(UserRepository);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should throw error if user not found', async () => {
    const userId = 'user-123';
    const error = EntityNotFoundError.byId(userId);
    const request: CreateFirebaseTokenRequest =
      CreateFirebaseTokenRequestBuilder.createFirebaseTokenRequest();
    jest.spyOn(userRepository, 'getOneById').mockRejectedValueOnce(error);
    const command = new CreateFirebaseTokenCommand(userId, request);

    await expect(handler.execute(command)).rejects.toThrow(error);
  });

  it('should set existing FirebaseTokenEntity to active if entity found', async () => {
    const user = EntityStubs.buildStubUser();
    const firebaseToken = EntityStubs.buildStubFirebaseToken({
      user: user,
      recordStatus: RecordStatus.Inactive,
    });
    jest.spyOn(userRepository, 'getOneById').mockResolvedValueOnce(user);
    jest
      .spyOn(firebaseRepository, 'findOneByToken')
      .mockResolvedValueOnce(firebaseToken);
    const request: CreateFirebaseTokenRequest =
      CreateFirebaseTokenRequestBuilder.createFirebaseTokenRequest();
    const command = new CreateFirebaseTokenCommand('user-123', request);

    await handler.execute(command);

    expect(firebaseToken.recordStatus).toBe(RecordStatus.Active);
  });

  it('should create a new FirebaseTokenEntity if entity not found', async () => {
    const user = EntityStubs.buildStubUser();
    jest.spyOn(userRepository, 'getOneById').mockResolvedValueOnce(user);

    const request: CreateFirebaseTokenRequest =
      CreateFirebaseTokenRequestBuilder.createFirebaseTokenRequest();
    const command = new CreateFirebaseTokenCommand('user-123', request);

    await handler.execute(command);

    const repositoryPersistSpy = jest.spyOn(firebaseRepository, 'persist');

    expect(repositoryPersistSpy).toBeCalled();
  });
});
