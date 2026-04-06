import { ValidationService, Validator } from '@core/validation';
import { ReserveEntity } from '@module-persistence/entities';

export type ClientAwareCommand = { clientId: string };

export interface ReserveContext<TCommand extends ClientAwareCommand> {
  command: TCommand;
  reserve: ReserveEntity;
}

export interface ReserveValidator<TCommand extends ClientAwareCommand>
  extends Validator<ReserveContext<TCommand>> {}

export abstract class ReserveValidationService<
  TCommand extends ClientAwareCommand,
> extends ValidationService<ReserveContext<TCommand>> {}
