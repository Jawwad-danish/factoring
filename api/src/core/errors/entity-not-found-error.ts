import { CauseAwareError, Reason } from './cause-aware-error';

export class EntityNotFoundError extends CauseAwareError {
  constructor(message: string) {
    super('missing-entity', message);
  }

  getReason(): Reason {
    return Reason.Missing;
  }

  static byId(id: string, entityName = 'record') {
    return new EntityNotFoundError(`Could not find ${entityName} by id ${id}`);
  }
}
