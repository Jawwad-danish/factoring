import { mockToken } from '@core/test';
import { ValidationError } from '@core/validation';
import { ReserveRepository } from '@module-persistence/repositories';
import { Test, TestingModule } from '@nestjs/testing';
import { UUID } from '@core/uuid';
import { CreateReserveRequestBuilder } from '../../../../../../test';
import { CreateReserveCommand } from '../../../../create-reserve.command';
import { ExistingReserveIdValidator } from './existing-reserve-id.validator';
import { EntityStubs } from '@module-persistence/test';

describe('ExistingReserveIdValidator', () => {
  let validator: ExistingReserveIdValidator;
  let repository: ReserveRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExistingReserveIdValidator],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    validator = module.get(ExistingReserveIdValidator);
    repository = module.get(ReserveRepository);
  });

  it('When no reserve id is in payload, validation passes', async () => {
    const findOneByIdSpy = jest.spyOn(repository, 'findOneById');
    expect(
      validator.validate({
        command: new CreateReserveCommand(
          UUID.get(),
          CreateReserveRequestBuilder.brokerClaim(),
        ),
        reserve: EntityStubs.buildStubReserve(),
      }),
    ).resolves.not.toThrow();
    expect(findOneByIdSpy).toBeCalledTimes(0);
  });

  it('When reserve id is in payload and does not exist, validation passes', async () => {
    jest.spyOn(repository, 'findOneById').mockResolvedValue(null);
    expect(
      validator.validate({
        command: new CreateReserveCommand(
          UUID.get(),
          CreateReserveRequestBuilder.brokerClaim(),
        ),
        reserve: EntityStubs.buildStubReserve(),
      }),
    ).resolves.not.toThrow();
  });

  it('When reserve id is in payload and reserve exists, validation throws error', async () => {
    const reserve = EntityStubs.buildStubReserve();
    jest.spyOn(repository, 'findOneById').mockResolvedValue(reserve);
    expect(
      validator.validate({
        command: new CreateReserveCommand(
          reserve.id,
          CreateReserveRequestBuilder.from({
            id: UUID.get(),
          }),
        ),
        reserve,
      }),
    ).rejects.toThrow(ValidationError);
  });
});
