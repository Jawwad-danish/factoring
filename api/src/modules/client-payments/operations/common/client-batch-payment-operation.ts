import { ClientBatchPayment } from '@fs-bobtail/factoring/data';
import { ClientBatchPaymentRepository } from '@module-persistence/repositories';
import { ClientBatchPaymentContext } from '../../data';
import { ClientBatchPaymentMapper } from '../../mappers';
import { ClientBatchPaymentRuleService } from './rules/client-batch-payment-rule-service';
import { ClientBatchPaymentValidationService } from './validation';

export interface ClientBatchPaymentOperation<T> {
  run(payload: T, batchPaymentId?: string): Promise<ClientBatchPayment>;
}

export abstract class BaseClientBatchPaymentOperation<T>
  implements ClientBatchPaymentOperation<T>
{
  constructor(
    protected clientBatchPaymentRepository: ClientBatchPaymentRepository,
    protected mapper: ClientBatchPaymentMapper,
    private validationService: ClientBatchPaymentValidationService<T>,
    private ruleService: ClientBatchPaymentRuleService<T>,
  ) {}

  async run(
    payload: T,
    clientBatchPaymentId?: string,
  ): Promise<ClientBatchPayment> {
    const context = await this.createContext(payload, clientBatchPaymentId);
    await this.validationService.validate(context);
    await this.ruleService.run(context);
    return this.mapper.entityToModel(context.entity);
  }

  abstract createContext(
    payload: T,
    clientBatchPaymentId?: string,
  ): Promise<ClientBatchPaymentContext<T>>;
}
