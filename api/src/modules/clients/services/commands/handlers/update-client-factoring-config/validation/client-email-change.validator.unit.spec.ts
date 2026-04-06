import { mockToken } from '@core/test';
import { ValidationError } from '@core/validation';
import { UserRepository } from '@module-persistence';
import { EntityStubs } from '@module-persistence/test';
import { Test, TestingModule } from '@nestjs/testing';
import { ClientFactoringConfigRequestBuilder } from '../../../../../test';
import { ClientEmailChangeValidator } from './client-email-change.validator';

describe('ClientEmailChangeValidator', () => {
  let validator: ClientEmailChangeValidator;
  let userRepository: UserRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClientEmailChangeValidator],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    validator = module.get(ClientEmailChangeValidator);
    userRepository = module.get(UserRepository);
  });

  it('Should be defined', () => {
    expect(validator).toBeDefined();
  });

  it('Throws error when email already exists', async () => {
    jest
      .spyOn(userRepository, 'findByEmail')
      .mockResolvedValueOnce(EntityStubs.buildStubUser());

    await expect(
      validator.validate([
        ClientFactoringConfigRequestBuilder.from({
          email: 'john.doe@bobtail.com',
        }),
        EntityStubs.buildClientFactoringConfig(),
      ]),
    ).rejects.toThrow(ValidationError);
  });
});
