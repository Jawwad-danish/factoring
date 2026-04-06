import { businessMonthDayYear } from '@core/formatting';
import { Observability } from '@core/observability';
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
import dayjs from 'dayjs';
import { BrokerPaymentUpdatedEvent } from '../../../data';

@Injectable()
export class BrokerPaymentUpdatedAuditLogEventHandler {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly clientApi: ClientApi,
  ) {}

  @OnEvent(BrokerPaymentUpdatedEvent.EVENT_NAME, { async: true })
  @Observability.WithScope('broker-payment-updated-audit-log-event')
  async handleBrokerPaymentUpdate(event: BrokerPaymentUpdatedEvent) {
    await this.databaseService.withRequestContext(async () => {
      await this.createAuditLog(event);
    });
  }

  @Transactional('update-broker-factoring-stats')
  private async createAuditLog({
    brokerPaymentId,
    previousState,
  }: BrokerPaymentUpdatedEvent) {
    const entityManager = this.databaseService.getEntityManager();
    const brokerPayment = await entityManager.findOneOrFail(
      BrokerPaymentEntity,
      {
        id: brokerPaymentId,
        recordStatus: RecordStatus.Active,
      },
      {
        fields: [
          'id',
          'amount',
          'batchDate',
          'checkNumber',
          'type',
          'createdAt',
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
      operation: 'edit',
      invoiceId: brokerPayment.invoice.id,
      invoiceNumber: brokerPayment.invoice.displayId,
      invoiceCreationDate: brokerPayment.invoice.createdAt,
      brokerPaymentId: brokerPayment.id,
      brokerPaymentAmount: brokerPayment.amount,
      brokerPaymentCreationDate: brokerPayment.createdAt,
      brokerPaymentBatchDate: brokerPayment.batchDate,
      brokerPaymentCheckNumber: brokerPayment.checkNumber,
      brokerPaymentType: brokerPayment.type,
      previousBrokerPaymentBatchDate: previousState.batchDate,
      previousBrokerPaymentCheckNumber: previousState.checkNumber,
      previousBrokerPaymentType: previousState.type,
    };

    const notes = [`${client?.name || ''}.`];
    if (brokerPayment.type !== previousState.type) {
      notes.push(
        `Changed transaction type from ${previousState.type} to ${brokerPayment.type}.`,
      );
    }

    if (
      dayjs(brokerPayment.batchDate).diff(
        dayjs(previousState.batchDate),
        'days',
      ) != 0
    ) {
      notes.push(
        `Changed batch date from ${businessMonthDayYear(
          previousState.batchDate,
        )} to ${businessMonthDayYear(brokerPayment.batchDate)}.`,
      );
    }

    if (brokerPayment.checkNumber !== previousState.checkNumber) {
      if (
        previousState.checkNumber == null &&
        brokerPayment.checkNumber != null
      ) {
        notes.push(`Set Check Number to ${brokerPayment.checkNumber}.`);
      } else if (
        previousState.checkNumber != null &&
        brokerPayment.checkNumber == null
      ) {
        notes.push(`Removed Check Number ${previousState.checkNumber}.`);
      } else {
        notes.push(
          `Changed Check Number from ${previousState.checkNumber} to ${brokerPayment.checkNumber}.`,
        );
      }
    }

    audit.notes = notes;
    entityManager.persist(audit);
  }
}
