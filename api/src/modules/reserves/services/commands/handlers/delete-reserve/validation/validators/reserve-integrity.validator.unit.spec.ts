import { ValidationError } from '@core/validation';
import { Test, TestingModule } from '@nestjs/testing';
import { DeleteReserveRequestBuilder } from '../../../../../../test';
import { DeleteReserveCommand } from '../../../../delete-reserve.command';
import { ReserveIntegrityValidator } from './reserve-integrity.validator';
import { UUID } from '@core/uuid';
import { EntityStubs } from '@module-persistence/test';

describe('ReserveIntegrityValidator', () => {
  let validator: ReserveIntegrityValidator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReserveIntegrityValidator],
    }).compile();

    validator = module.get(ReserveIntegrityValidator);
  });

  it('Should be defined', () => {
    expect(validator).toBeDefined();
  });

  it('Throws error if different client and reserve', async () => {
    const entity = EntityStubs.buildStubReserve();
    expect(
      validator.validate({
        command: new DeleteReserveCommand(
          UUID.get(),
          entity.id,
          DeleteReserveRequestBuilder.from(),
        ),
        reserve: entity,
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('Does not throw error if same client', async () => {
    const entity = EntityStubs.buildStubReserve();
    expect(
      validator.validate({
        command: new DeleteReserveCommand(
          entity.clientId,
          entity.id,
          DeleteReserveRequestBuilder.from(),
        ),
        reserve: entity,
      }),
    ).resolves.not.toThrow();
  });
});
