import { Test, TestingModule } from '@nestjs/testing';
import { FirebaseTokenRepository } from '@module-persistence/repositories';
import { FirebaseTokenEntity } from '@module-persistence/entities';
import { mockToken } from '@core/test';
import { EntityStubs } from '@module-persistence';
import { FirebaseTokenService } from './firebase-token.service';

describe('FirebaseToken Service', () => {
  let service: FirebaseTokenService;
  let firebaseRepository: FirebaseTokenRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FirebaseTokenService],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    service = module.get<FirebaseTokenService>(FirebaseTokenService);
    firebaseRepository = module.get<FirebaseTokenRepository>(
      FirebaseTokenRepository,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('get All firebaseTokens for a user', async () => {
    const user = EntityStubs.buildStubUser();
    const firebaseTokens: FirebaseTokenEntity[] = [
      EntityStubs.buildStubFirebaseToken({
        token: 'token-1',
        user: user,
      }),
      EntityStubs.buildStubFirebaseToken({
        token: 'token-2',
        user: user,
      }),
    ];
    jest
      .spyOn(firebaseRepository, 'findTokensByUserId')
      .mockResolvedValueOnce(firebaseTokens);

    const entities = await service.getByUserId(user.id);

    expect(entities).toHaveLength(2);
  });
});
