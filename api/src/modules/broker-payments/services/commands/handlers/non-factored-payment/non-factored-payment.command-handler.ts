import { BasicCommandHandler } from '@module-cqrs';
import { InvoiceChangeActionsExecutor } from '@module-invoices-tag-activity';
import { BrokerPaymentEntity, InvoiceRepository } from '@module-persistence';
import { CommandHandler } from '@nestjs/cqrs';
import { BrokerPaymentMapper } from '../../../../data';
import { NonFactoredPaymentCommand } from '../../non-factored-payment.command';
import { NonFactoredPaymentPaymentRuleService } from './rules';
import { NonFactoredPaymentValidationService } from './validation';

@CommandHandler(NonFactoredPaymentCommand)
export class NonFactoredPaymentCommandHandler
  implements BasicCommandHandler<NonFactoredPaymentCommand>
{
  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly brokerPaymentMapper: BrokerPaymentMapper,
    private readonly invoiceChangeActionsExecutor: InvoiceChangeActionsExecutor,
    private readonly validationService: NonFactoredPaymentValidationService,
    private readonly rulesService: NonFactoredPaymentPaymentRuleService,
  ) {}

  async execute({
    request,
  }: NonFactoredPaymentCommand): Promise<BrokerPaymentEntity> {
    const invoice = await this.invoiceRepository.getOneById(request.invoiceId);
    const brokerPayment = this.brokerPaymentMapper.requestToEntity(request);
    await this.validationService.validate({
      brokerPayment,
      invoice,
      request,
    });
    invoice.brokerPayments.add(brokerPayment);
    const changeActions = await this.rulesService.execute({
      invoice,
      brokerPayment,
      request,
    });
    await this.invoiceChangeActionsExecutor.apply(invoice, changeActions);
    return brokerPayment;
  }
}
