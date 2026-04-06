import { ValidationError } from '@core/validation';
import { Test, TestingModule } from '@nestjs/testing';
import { UUID } from '@core/uuid';
import { DeleteReserveRequestBuilder } from '../../../../../../test';
import {
  REVERSED_RESERVE_PAYLOAD_KEY,
  REVERSING_RESERVE_PAYLOAD_KEY,
} from '../../delete-reserve.command-handler';
import { IsDeletedValidator } from './is-deleted.validator';
import { DeleteReserveCommand } from '../../../../delete-reserve.command';
import { EntityStubs } from '@module-persistence/test';

describe('IsDeletedValidator', () => {
  let validator: IsDeletedValidator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IsDeletedValidator],
    }).compile();

    validator = module.get(IsDeletedValidator);
  });

  it('Should be defined', () => {
    expect(validator).toBeDefined();
  });

  it('Throws error if reserve is reversing another reserve', async () => {
    const reserve = EntityStubs.buildStubReserve({
      payload: {
        [REVERSING_RESERVE_PAYLOAD_KEY]: UUID.get(),
      },
    });
    expect(
      validator.validate({
        command: new DeleteReserveCommand(
          UUID.get(),
          UUID.get(),
          DeleteReserveRequestBuilder.from(),
        ),
        reserve,
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('Throws error if reserve is reversed by another reserve', async () => {
    const reserve = EntityStubs.buildStubReserve({
      payload: {
        [REVERSED_RESERVE_PAYLOAD_KEY]: UUID.get(),
      },
    });
    expect(
      validator.validate({
        command: new DeleteReserveCommand(
          UUID.get(),
          UUID.get(),
          DeleteReserveRequestBuilder.from(),
        ),
        reserve,
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('Does not throw error if not reversed or reversing', async () => {
    expect(
      validator.validate({
        command: new DeleteReserveCommand(
          UUID.get(),
          UUID.get(),
          DeleteReserveRequestBuilder.from(),
        ),
        reserve: EntityStubs.buildStubReserve(),
      }),
    ).resolves.not.toThrow();
  });
});
