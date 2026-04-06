import {
  ClientBatchPaymentEntity,
  ClientPaymentEntity,
  ClientPaymentOperationType,
  ClientPaymentType,
  InvoiceClientPaymentEntity,
  InvoiceEntity,
  PaymentStatus,
  PaymentType,
  RecordStatus,
  ReserveClientPaymentEntity,
  ReserveEntity,
  ReserveReason,
} from '@module-persistence/entities';
import {
  ClientBatchPaymentRepository,
  ClientPaymentRepository,
  InvoiceClientPaymentRepository,
  ReserveClientPaymentRepository,
  ReserveRepository,
  UserRepository,
} from '@module-persistence/repositories';
import { Injectable, Logger } from '@nestjs/common';
import Big from 'big.js';
import {
  ClientAccountPaymentAttributions,
  ClientBatchPaymentContext,
  CreateClientBatchPaymentRequest,
} from '../../../data';
import { ClientBatchPaymentRule } from '../../common/rules';

@Injectable()
export class CreateClientBatchPaymentRule
  implements ClientBatchPaymentRule<CreateClientBatchPaymentRequest>
{
  private logger = new Logger(CreateClientBatchPaymentRule.name);
  constructor(
    private readonly clientBatchPaymentRepository: ClientBatchPaymentRepository,
    private readonly clientPaymentsRepository: ClientPaymentRepository,
    private readonly invoiceClientPaymentRepository: InvoiceClientPaymentRepository,
    private readonly reserveRepository: ReserveRepository,
    private readonly reserveClientPaymentRepository: ReserveClientPaymentRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async run(
    context: ClientBatchPaymentContext<CreateClientBatchPaymentRequest>,
  ) {
    const { entity, data, invoiceList, paymentExists } = context;
    if (!paymentExists) {
      this.clientBatchPaymentRepository.persist(entity);
      this.logger.log(
        `A new client batch payment with id ${entity.id} was created`,
      );

      if (data?.client_payments && data?.client_payments.length > 0) {
        for (const payment of data.client_payments) {
          const clientPaymentEntity = await this.createClientPaymentEntity(
            payment,
            entity,
            data.transfer_type,
          );
          entity.clientPayments.add(clientPaymentEntity);

          if (data.transfer_type === PaymentType.DEBIT) {
            const reserve = this.createReserveEntity(clientPaymentEntity);
            this.reserveRepository.persist(reserve);
          }

          if (
            payment?.client_account_payment_attributions &&
            payment?.client_account_payment_attributions.length > 0
          ) {
            for (const invoicePayment of payment.client_account_payment_attributions) {
              const invoice = invoiceList.find(
                (invoice) => invoice.id === invoicePayment.invoice_id,
              );
              if (invoice) {
                const invoiceClientPayment =
                  await this.createInvoiceClientPaymentEntity(
                    invoicePayment,
                    invoice,
                    clientPaymentEntity,
                  );
                this.invoiceClientPaymentRepository.persist(
                  invoiceClientPayment,
                );
              }
            }
          }
        }
      }
      this.clientBatchPaymentRepository.persist(entity);
    } else {
      this.logger.log('Skipping payment creation. Reason: Already exists.');
    }
  }

  private async createClientPaymentEntity(
    paymentData: Record<string, any>,
    batchPaymentEntity: ClientBatchPaymentEntity,
    transferType: PaymentType,
  ): Promise<ClientPaymentEntity> {
    const clientPaymentEntity = new ClientPaymentEntity();
    clientPaymentEntity.id = paymentData.id;
    clientPaymentEntity.amount = Big(paymentData.amount);
    clientPaymentEntity.transferFee = Big(paymentData.fee) || Big(0);
    clientPaymentEntity.clientId = paymentData.client_id;
    clientPaymentEntity.status = this.mapInvoicePaymentStatus(
      batchPaymentEntity.status,
    );
    clientPaymentEntity.transferType = transferType;
    clientPaymentEntity.recordStatus = RecordStatus.Active;
    clientPaymentEntity.operationType = ClientPaymentOperationType.Credit;
    clientPaymentEntity.type = ClientPaymentType.Invoice;
    clientPaymentEntity.createdBy = await this.userRepository.getOneById(
      paymentData.updated_by,
    );
    clientPaymentEntity.updatedBy = await this.userRepository.getOneById(
      paymentData.updated_by,
    );

    await this.clientPaymentsRepository.assignAccountId(
      paymentData.clientaccountpayments[0].client_bank_account_id,
      clientPaymentEntity,
    );
    await this.clientPaymentsRepository.assignBatchPaymentId(
      batchPaymentEntity.id,
      clientPaymentEntity,
    );
    return clientPaymentEntity;
  }
  private async createInvoiceClientPaymentEntity(
    invoicePayment: ClientAccountPaymentAttributions,
    invoice: InvoiceEntity,
    paymentEntity: ClientPaymentEntity,
  ): Promise<InvoiceClientPaymentEntity> {
    const invoiceClientPayment = new InvoiceClientPaymentEntity();
    invoiceClientPayment.amount = Big(invoicePayment.amount);
    invoiceClientPayment.invoice = invoice;
    invoiceClientPayment.recordStatus = RecordStatus.Active;
    invoiceClientPayment.clientPayment = paymentEntity;

    return invoiceClientPayment;
  }

  private createReserveEntity(
    clientPaymentEntity: ClientPaymentEntity,
  ): ReserveEntity {
    const reserveEntity = new ReserveEntity();
    const reserveClientPaymentEntity = new ReserveClientPaymentEntity();

    reserveEntity.amount = Big(clientPaymentEntity.amount);

    this.reserveRepository.assign(reserveEntity, {
      clientId: clientPaymentEntity.clientId,
    });
    reserveEntity.reason = ReserveReason.ClientDebit;
    reserveEntity.note = 'Client debit operation';
    this.reserveClientPaymentRepository.assign(reserveClientPaymentEntity, {
      clientPayment: reserveEntity.clientId,
    });

    reserveClientPaymentEntity.clientPayment = clientPaymentEntity;
    reserveClientPaymentEntity.reserve = reserveEntity;

    return reserveEntity;
  }

  private mapInvoicePaymentStatus(status: string) {
    switch (status) {
      case 'sent':
      case 'accepted':
        return PaymentStatus.DONE;
      case 'declined1':
      case 'declined2':
      case 'declined3':
      case 'declined4':
      case 'declined5':
        return PaymentStatus.FAILED;
      default:
        return PaymentStatus.PENDING;
    }
  }
}
