import { mockToken } from '@core/test';
import { ValidationError } from '@core/validation';
import { FeatureFlagResolver } from '@module-common';
import { ClientFactoringStatus } from '@module-persistence/entities';
import { ClientFactoringConfigsRepository } from '@module-persistence/repositories';
import { Test, TestingModule } from '@nestjs/testing';
import { UUID } from '@core/uuid';
import { EntityStubs } from '@module-persistence/test';
import { ClientStatusValidator } from './client-status.validator';
import { ReserveIntegrityValidator } from '../../delete-reserve/validation/validators/reserve-integrity.validator';
import { DeleteReserveCommand } from '../../../delete-reserve.command';
import { DeleteReserveRequest } from '../../../../../data';

describe('ClientStatusValidator', () => {
  let clientFactoringConfigRepository: ClientFactoringConfigsRepository;
  let featureFlagResolver: FeatureFlagResolver;
  let validator: ReserveIntegrityValidator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClientStatusValidator],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    clientFactoringConfigRepository = module.get(
      ClientFactoringConfigsRepository,
    );
    featureFlagResolver = module.get(FeatureFlagResolver);
    validator = module.get(ClientStatusValidator);
  });

  it('Should be defined', () => {
    expect(validator).toBeDefined();
  });

  it('Throws error if client status different than active', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValue(true);
    jest
      .spyOn(clientFactoringConfigRepository, 'getOneByClientId')
      .mockResolvedValue(
        EntityStubs.buildClientFactoringConfig({
          status: ClientFactoringStatus.Hold,
        }),
      );
    expect(
      validator.validate({
        command: new DeleteReserveCommand(
          UUID.get(),
          UUID.get(),
          new DeleteReserveRequest(),
        ),
        reserve: EntityStubs.buildStubReserve(),
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('Does not throw error if client status different than active and feature flag is off', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValue(false);
    jest
      .spyOn(clientFactoringConfigRepository, 'getOneByClientId')
      .mockResolvedValue(
        EntityStubs.buildClientFactoringConfig({
          status: ClientFactoringStatus.Hold,
        }),
      );
    expect(
      validator.validate({
        command: new DeleteReserveCommand(
          UUID.get(),
          UUID.get(),
          new DeleteReserveRequest(),
        ),
        reserve: EntityStubs.buildStubReserve(),
      }),
    ).resolves.not.toThrow();
  });

  it('Does not throw error if client status is active', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValue(true);
    jest
      .spyOn(clientFactoringConfigRepository, 'getOneByClientId')
      .mockResolvedValue(
        EntityStubs.buildClientFactoringConfig({
          status: ClientFactoringStatus.Active,
        }),
      );
    expect(
      validator.validate({
        command: new DeleteReserveCommand(
          UUID.get(),
          UUID.get(),
          new DeleteReserveRequest(),
        ),
        reserve: EntityStubs.buildStubReserve(),
      }),
    ).resolves.not.toThrow();
  });
});
