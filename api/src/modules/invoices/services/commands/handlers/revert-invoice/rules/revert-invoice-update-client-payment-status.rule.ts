import { ChangeActions } from '@common';
import { CrossCuttingConcerns } from '@core/util';
import {
  CommandInvoiceContext,
  RevertInvoiceRequest,
} from '@module-invoices/data';
import {
  ClientPaymentStatus,
  InvoiceClientPaymentRepository,
  ReserveClientPaymentEntity,
  ReserveClientPaymentRepository,
  ReserveEntity,
  ReserveReason,
} from '@module-persistence';
import { Injectable } from '@nestjs/common';
import { RevertInvoiceRule } from './revert-invoice-rule';

@Injectable()
export class RevertInvoiceUpdateClientPaymentStatusRule
  implements RevertInvoiceRule
{
  constructor(
    private readonly invoiceClientPaymentRepository: InvoiceClientPaymentRepository,
    private readonly reserveClientPaymentRepository: ReserveClientPaymentRepository,
  ) {}

  @CrossCuttingConcerns({
    logging: ({ entity }: CommandInvoiceContext<RevertInvoiceRequest>) => {
      return {
        message: `Revert invoice update client payment status rule`,
        payload: {
          invoice: {
            id: entity.id,
            loadNumber: entity.loadNumber,
          },
        },
      };
    },
  })
  async run(
    context: CommandInvoiceContext<RevertInvoiceRequest>,
  ): Promise<ChangeActions> {
    const { entity } = context;

    if (entity.clientPaymentStatus === ClientPaymentStatus.Pending) {
      entity.clientPaymentStatus = ClientPaymentStatus.NotApplicable;
    }

    if (entity.clientPaymentStatus === ClientPaymentStatus.Failed) {
      const [invoicePayments] =
        await this.invoiceClientPaymentRepository.findAll(
          {
            invoice: entity.id,
          },
          { populate: ['clientPayment'] },
        );
      const paymentIds = invoicePayments.map(
        (payment) => payment.clientPayment.id,
      );

      const [reserveClientPayments] =
        await this.reserveClientPaymentRepository.findAll(
          {
            clientPayment: { $in: paymentIds },
          },
          { populate: ['reserve', 'clientPayment'] },
        );

      reserveClientPayments.forEach((payment) => {
        const revertPaymentReserveEntity =
          this.createRevertedReserveClientPayment(payment);
        this.reserveClientPaymentRepository.persist(revertPaymentReserveEntity);
      });

      entity.clientPaymentStatus = ClientPaymentStatus.NotApplicable;
    }
    return ChangeActions.empty();
  }

  private createRevertedReserveClientPayment(
    existingClientPayment: ReserveClientPaymentEntity,
  ): ReserveClientPaymentEntity {
    const reserveClientPayment = new ReserveClientPaymentEntity();
    reserveClientPayment.clientPayment = existingClientPayment.clientPayment;
    if (existingClientPayment.reserve) {
      reserveClientPayment.reserve = this.createRevertedReserveEntity(
        existingClientPayment.reserve,
      );
    }
    return reserveClientPayment;
  }

  private createRevertedReserveEntity(
    existingReserve: ReserveEntity,
  ): ReserveEntity {
    const reserve = new ReserveEntity();
    reserve.amount = existingReserve.amount.neg();
    reserve.clientId = existingReserve.clientId;
    reserve.createdBy = existingReserve.createdBy;
    reserve.note = `Remove reserve due to reverting invoice.`;
    reserve.reason = ReserveReason.ClientCreditRemoved;
    return reserve;
  }
}
