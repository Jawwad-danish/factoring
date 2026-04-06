import { BasicCommandHandler } from '@module-cqrs';
import { InvoiceChangeActionsExecutor } from '@module-invoices-tag-activity';
import {
  BrokerPaymentEntity,
  BrokerPaymentRepository,
  InvoiceRepository,
  RecordStatus,
} from '@module-persistence';
import { CommandHandler } from '@nestjs/cqrs';
import { DeleteBrokerPaymentCommand } from '../../delete-broker-payment.command';
import { UpdateBrokerPaymentCommand } from '../../update-broker-payment.command';
import { DeleteBrokerPaymentRuleService } from './rules';
import { DeleteBrokerPaymentValidationService } from './validation';

@CommandHandler(DeleteBrokerPaymentCommand)
export class DeleteBrokerPaymentCommandHandler
  implements BasicCommandHandler<UpdateBrokerPaymentCommand>
{
  constructor(
    private readonly brokerPaymentRepository: BrokerPaymentRepository,
    private readonly invoiceRepository: InvoiceRepository,
    private readonly invoiceChangeActionsExecutor: InvoiceChangeActionsExecutor,
    private readonly validationService: DeleteBrokerPaymentValidationService,
    private readonly rulesService: DeleteBrokerPaymentRuleService,
  ) {}

  async execute({
    brokerPaymentId,
    request,
  }: DeleteBrokerPaymentCommand): Promise<BrokerPaymentEntity> {
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
    brokerPayment.recordStatus = RecordStatus.Inactive;
    const changeActions = await this.rulesService.execute({
      invoice,
      brokerPayment,
      request,
    });
    await this.invoiceChangeActionsExecutor.apply(invoice, changeActions);
    return brokerPayment;
  }
}
