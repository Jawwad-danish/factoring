import { formatToDollars } from '@core/formatting';
import { penniesToDollars } from '@core/formulas';
import { Observability } from '@core/observability';
import { BrokerPaymentDeletedEvent } from '@module-broker-payments/data';
import { ClientApi } from '@module-clients';
import { DatabaseService, Transactional } from '@module-database';
import {
  AuditLogEntity,
  AuditLogType,
  BrokerPaymentEntity,
  RecordStatus,
} from '@module-persistence/entities';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class BrokerPaymentDeletedAuditLogEventHandler {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly clientApi: ClientApi,
  ) {}

  @OnEvent(BrokerPaymentDeletedEvent.EVENT_NAME, { async: true })
  @Observability.WithScope('broker-payment-deleted-audit-log-event')
  async handleBrokerPaymentCreate(event: BrokerPaymentDeletedEvent) {
    await this.databaseService.withRequestContext(async () => {
      await this.createAuditLog(event);
    });
  }

  @Transactional('update-broker-factoring-stats')
  private async createAuditLog({ brokerPaymentId }: BrokerPaymentDeletedEvent) {
    const entityManager = this.databaseService.getEntityManager();
    const brokerPayment = await entityManager.findOneOrFail(
      BrokerPaymentEntity,
      {
        id: brokerPaymentId,
        recordStatus: RecordStatus.Inactive,
      },
      {
        fields: [
          'id',
          'batchDate',
          'checkNumber',
          'type',
          'amount',
          'createdAt',
          'invoice.id',
          'invoice.clientId',
          'invoice.createdAt',
          'invoice.displayId',
        ],
        populate: ['invoice'],
      },
    );
    const client = await this.clientApi.findById(
      brokerPayment.invoice.clientId,
    );
    const audit = new AuditLogEntity();
    audit.type = AuditLogType.BrokerPayment;
    audit.payload = {
      operation: 'delete',
      invoiceId: brokerPayment.invoice.id,
      invoiceNumber: brokerPayment.invoice.displayId,
      invoiceCreationDate: brokerPayment.invoice.createdAt,
      brokerPaymentId: brokerPayment.id,
      brokerPaymentAmount: brokerPayment.amount,
      brokerPaymentCreationDate: brokerPayment.createdAt,
      brokerPaymentBatchDate: brokerPayment.batchDate,
      brokerPaymentCheckNumber: brokerPayment.checkNumber,
      brokerPaymentType: brokerPayment.type,
    };
    audit.notes = [
      `${client?.name || ''}.`,
      `Deleted amount: ${formatToDollars(
        penniesToDollars(brokerPayment.amount),
      )}.`,
    ];
    entityManager.persist(audit);
  }
}
