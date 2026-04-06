import { mockToken } from '@core/test';
import { ValidationError } from '@core/validation';
import { ClientSuccessTeamEntity } from '@module-persistence/entities';
import { ClientSuccessTeamRepository } from '@module-persistence/repositories';
import { Test, TestingModule } from '@nestjs/testing';
import { ClientFactoringConfigRequestBuilder } from '../../../../../test';
import { ClientSuccessTeamChangeValidator } from './client-success-team-change.validator';
import { EntityStubs } from '@module-persistence/test';

describe('Client Sucess Team Change validator', () => {
  let validator: ClientSuccessTeamChangeValidator;
  let clientSuccessTeamRepository: ClientSuccessTeamRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClientSuccessTeamChangeValidator],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    validator = module.get(ClientSuccessTeamChangeValidator);
    clientSuccessTeamRepository = module.get(ClientSuccessTeamRepository);
  });

  const mockClientSuccessTeam = (data?: Partial<ClientSuccessTeamEntity>) => {
    const stub = EntityStubs.buildClientSuccessTeam(data);
    jest
      .spyOn(clientSuccessTeamRepository, 'findOneById')
      .mockResolvedValueOnce(stub);
    return stub;
  };

  it('Should be defined', () => {
    expect(validator).toBeDefined();
  });

  it('Throws error when client success team does not exist', async () => {
    jest
      .spyOn(clientSuccessTeamRepository, 'findOneById')
      .mockResolvedValueOnce(null);
    expect(
      validator.validate([
        ClientFactoringConfigRequestBuilder.from({
          successTeamId: '123',
        }),
        EntityStubs.buildClientFactoringConfig(),
      ]),
    ).rejects.toThrow(ValidationError);
  });

  it('Does not throw error if client success team exists', async () => {
    mockClientSuccessTeam();
    expect(
      validator.validate([
        ClientFactoringConfigRequestBuilder.from({
          successTeamId: '123',
        }),
        EntityStubs.buildClientFactoringConfig(),
      ]),
    ).resolves.not.toThrow();
  });
});
