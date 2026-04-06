import { BasicCommandHandler } from '@module-cqrs';
import { InvoiceChangeActionsExecutor } from '@module-invoices-tag-activity';
import { BrokerPaymentEntity, InvoiceRepository } from '@module-persistence';
import { CommandHandler } from '@nestjs/cqrs';
import { BrokerPaymentMapper } from '../../../../data';
import { CreateBrokerPaymentCommand } from '../../create-broker-payment.command';
import { CreateBrokerPaymentRuleService } from './rules';
import { CreateBrokerPaymentValidationService } from './validation';

@CommandHandler(CreateBrokerPaymentCommand)
export class CreateBrokerPaymentCommandHandler
  implements BasicCommandHandler<CreateBrokerPaymentCommand>
{
  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly brokerPaymentMapper: BrokerPaymentMapper,
    private readonly invoiceChangeActionsExecutor: InvoiceChangeActionsExecutor,
    private readonly validationService: CreateBrokerPaymentValidationService,
    private readonly rulesService: CreateBrokerPaymentRuleService,
  ) {}

  async execute({
    request,
  }: CreateBrokerPaymentCommand): Promise<BrokerPaymentEntity> {
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
