import { ValidationError, Validator } from '@core/validation';
import { BasicEntity, RecordStatus } from '@module-persistence/entities';

export class ActiveEntityValidator<C> implements Validator<C> {
  constructor(private readonly entitySupplier: (context: C) => BasicEntity) {}

  async validate(context: C): Promise<void> {
    const entity = this.entitySupplier(context);
    if (entity.recordStatus !== RecordStatus.Active) {
      throw new ValidationError(
        'active',
        `Cannot update because it's not active`,
      );
    }
  }
}
