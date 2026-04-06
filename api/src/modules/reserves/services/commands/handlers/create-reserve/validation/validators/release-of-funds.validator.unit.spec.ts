import { mockToken } from '@core/test';
import { ValidationError } from '@core/validation';
import { ReserveReason } from '@module-persistence/entities';
import { ReserveRepository } from '@module-persistence/repositories';
import { Test, TestingModule } from '@nestjs/testing';
import { UUID } from '@core/uuid';
import { CreateReserveRequestBuilder } from '../../../../../../test';
import { CreateReserveCommand } from '../../../../create-reserve.command';
import { ExistingReserveIdValidator } from './existing-reserve-id.validator';
import { ReleaseOfFundsValidator } from './release-of-funds.validator';
import Big from 'big.js';
import { EntityStubs } from '@module-persistence/test';

describe('ExistingReserveIdValidator', () => {
  let validator: ExistingReserveIdValidator;
  let repository: ReserveRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReleaseOfFundsValidator],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    validator = module.get(ReleaseOfFundsValidator);
    repository = module.get(ReserveRepository);
  });

  it('When reserve is not release of funds the validation passes', async () => {
    expect(
      validator.validate({
        command: new CreateReserveCommand(
          UUID.get(),
          CreateReserveRequestBuilder.brokerClaim(),
        ),
        reserve: EntityStubs.buildStubReserve({
          reason: ReserveReason.BrokerClaim,
        }),
      }),
    ).resolves.not.toThrow();
  });

  it('When reserve is release of funds and reserve client total is negative it throws error', async () => {
    jest.spyOn(repository, 'getTotalByClient').mockResolvedValueOnce(-100);

    expect(
      validator.validate({
        command: new CreateReserveCommand(
          UUID.get(),
          CreateReserveRequestBuilder.releaseOfFunds(),
        ),
        reserve: EntityStubs.buildStubReserve({
          reason: ReserveReason.ReleaseOfFunds,
        }),
      }),
    ).rejects.toThrowError(ValidationError);
  });

  it('When reserve is release of funds and greater than reserve client it throws error', async () => {
    jest.spyOn(repository, 'getTotalByClient').mockResolvedValueOnce(100);

    expect(
      validator.validate({
        command: new CreateReserveCommand(
          UUID.get(),
          CreateReserveRequestBuilder.releaseOfFunds(),
        ),
        reserve: EntityStubs.buildStubReserve({
          reason: ReserveReason.ReleaseOfFunds,
          amount: new Big(-200),
        }),
      }),
    ).rejects.toThrowError(ValidationError);
  });
});
