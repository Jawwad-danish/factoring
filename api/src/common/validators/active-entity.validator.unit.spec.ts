import { ValidationError } from '@core/validation';
import { BasicEntity, RecordStatus } from '@module-persistence/entities';
import { ActiveEntityValidator } from './active-entity.validator';

interface Context {
  entity: BasicEntity;
}

describe('Check entity status', () => {
  let validator: ActiveEntityValidator<Context>;

  beforeEach(async () => {
    validator = new ActiveEntityValidator((context) => context.entity);
  });

  it('When entity record status is active, validator passes', async () => {
    const entity = new BasicEntity();
    entity.recordStatus = RecordStatus.Active;
    expect(validator.validate({ entity })).resolves.not.toThrow();
  });

  it('When entity record status is inactive, validator throws error', async () => {
    const entity = new BasicEntity();
    entity.recordStatus = RecordStatus.Inactive;
    expect(validator.validate({ entity })).rejects.toThrow(ValidationError);
  });
});
