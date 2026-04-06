import { BasicCommandHandler } from '@module-cqrs';
import { InvoiceChangeActionsExecutor } from '@module-invoices-tag-activity';
import {
  BrokerPaymentEntity,
  BrokerPaymentRepository,
  BrokerPaymentType,
  InvoiceRepository,
} from '@module-persistence';
import { CommandHandler } from '@nestjs/cqrs';
import { UpdateBrokerPaymentRequest } from '../../../../data';
import { UpdateBrokerPaymentCommand } from '../../update-broker-payment.command';
import { UpdateBrokerPaymentRuleService } from './rules';
import { UpdateBrokerPaymentValidationService } from './validation';

@CommandHandler(UpdateBrokerPaymentCommand)
export class UpdateBrokerPaymentCommandHandler
  implements BasicCommandHandler<UpdateBrokerPaymentCommand>
{
  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly brokerPaymentRepository: BrokerPaymentRepository,
    private readonly invoiceChangeActionsExecutor: InvoiceChangeActionsExecutor,
    private readonly validationService: UpdateBrokerPaymentValidationService,
    private readonly rulesService: UpdateBrokerPaymentRuleService,
  ) {}

  async execute({
    brokerPaymentId,
    request,
  }: UpdateBrokerPaymentCommand): Promise<BrokerPaymentEntity> {
    const invoice = await this.invoiceRepository.getByBrokerPaymentId(
      brokerPaymentId,
    );
    const brokerPayment = await this.brokerPaymentRepository.getOneById(
      brokerPaymentId,
    );
    await this.validationService.validate({
      brokerPayment,
      invoice,
      request,
    });
    this.updateBrokerPayment(brokerPayment, request);
    const changeActions = await this.rulesService.execute({
      invoice,
      brokerPayment,
      request,
    });
    await this.invoiceChangeActionsExecutor.apply(invoice, changeActions);
    return brokerPayment;
  }

  private updateBrokerPayment(
    brokerPayment: BrokerPaymentEntity,
    request: UpdateBrokerPaymentRequest,
  ) {
    brokerPayment.batchDate = request.batchDate;
    brokerPayment.checkNumber =
      request.type === BrokerPaymentType.Ach
        ? null
        : request.checkNumber ?? null;
    brokerPayment.type = request.type;
  }
}
