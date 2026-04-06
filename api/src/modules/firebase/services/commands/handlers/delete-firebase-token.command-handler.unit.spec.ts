import { Test, TestingModule } from '@nestjs/testing';
import { FirebaseTokenRepository } from '@module-persistence/repositories';
import { RecordStatus } from '@module-persistence/entities';
import { mockToken } from '@core/test';
import { EntityStubs } from '@module-persistence';
import { DeleteFirebaseTokenCommand } from '../delete-firebase-token.command';
import { DeleteFirebaseTokenCommandHandler } from './delete-firebase-token.command-handler';
import { DeleteFirebaseTokenRequest } from '../../../data';
import { DeleteFirebaseTokenRequestBuilder } from '@module-firebase/test';

describe('DeleteFirebaseTokenCommandHandler', () => {
  let handler: DeleteFirebaseTokenCommandHandler;
  let firebaseRepository: FirebaseTokenRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DeleteFirebaseTokenCommandHandler],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    handler = module.get<DeleteFirebaseTokenCommandHandler>(
      DeleteFirebaseTokenCommandHandler,
    );
    firebaseRepository = module.get<FirebaseTokenRepository>(
      FirebaseTokenRepository,
    );
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('FirebaseTokenEntity should be marked for soft delete', async () => {
    const user = EntityStubs.buildStubUser();
    const firebaseToken = EntityStubs.buildStubFirebaseToken({
      user: user,
    });
    jest
      .spyOn(firebaseRepository, 'findOneByToken')
      .mockResolvedValueOnce(firebaseToken);
    const token = 'exampleToken123';
    const request: DeleteFirebaseTokenRequest =
      DeleteFirebaseTokenRequestBuilder.from();
    const command = new DeleteFirebaseTokenCommand(token, 'user-123', request);

    await handler.execute(command);

    expect(firebaseToken.recordStatus).toBe(RecordStatus.Inactive);
  });
});
