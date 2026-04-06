import { Test, TestingModule } from '@nestjs/testing';
import { FirebaseTokenRepository } from '@module-persistence/repositories';
import { RecordStatus } from '@module-persistence/entities';
import { mockToken } from '@core/test';
import { EntityStubs } from '@module-persistence';
import { DeleteAllFirebaseTokensCommandHandler } from './delete-all-firebase-tokens.command-handler';
import { DeleteAllFirebaseTokensCommand } from '../delete-all-firebase-tokens.command';

describe('DeleteAllFirebaseTokensCommandHandler', () => {
  let handler: DeleteAllFirebaseTokensCommandHandler;
  let firebaseRepository: FirebaseTokenRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DeleteAllFirebaseTokensCommandHandler],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    handler = module.get<DeleteAllFirebaseTokensCommandHandler>(
      DeleteAllFirebaseTokensCommandHandler,
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
      .spyOn(firebaseRepository, 'findTokensByUserId')
      .mockResolvedValueOnce([firebaseToken]);
    const command = new DeleteAllFirebaseTokensCommand(user.id);

    await handler.execute(command);

    expect(firebaseToken.recordStatus).toBe(RecordStatus.Inactive);
  });
});
