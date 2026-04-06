import { ActivityLogPayloadBuilder, ChangeActions, EmailEvents } from '@common';
import { Note } from '@core/data';
import { Broker, BrokerEmailType } from '@module-brokers/data';
import {
  ClientBrokerAssignmentAssocEntity,
  ClientBrokerAssignmentEntity,
  ClientBrokerAssignmentStatus,
  InvoiceEntity,
  TagDefinitionKey,
} from '@module-persistence/entities';
import { ClientBrokerAssignmentRepository } from '@module-persistence/repositories';
import { Injectable, Logger } from '@nestjs/common';
import {
  CommandInvoiceContext,
  PurchaseInvoiceRequest,
  SendNoaEvent,
} from '../../../../../data';
import { PurchaseInvoiceRule } from '../../purchase-invoice/rules/purchase-invoice-rule';
import { EventPublisher } from '@module-cqrs';

@Injectable()
export class ClientBrokerAssignmentRule implements PurchaseInvoiceRule {
  private logger = new Logger(ClientBrokerAssignmentRule.name);

  constructor(
    private readonly clientBrokerAssignmentRepository: ClientBrokerAssignmentRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async run(
    context: CommandInvoiceContext<PurchaseInvoiceRequest>,
  ): Promise<ChangeActions> {
    const { entity, client, broker } = context;
    if (!broker) {
      this.logger.warn(
        'Invoices does not have any broker. Assignment will be skiped',
        {
          loadNumber: entity.loadNumber,
        },
      );
      return ChangeActions.empty();
    }

    const clientBrokerAssignment =
      await this.clientBrokerAssignmentRepository.findOne(
        entity.clientId,
        broker.id,
      );

    if (!clientBrokerAssignment) {
      this.logger.debug('No assignment found between client and broker', {
        clientId: entity.clientId,
        brokerId: entity.brokerId,
      });
      this.clientBrokerAssignmentRepository.persist(
        this.buildClientBrokerAssignmentEntity(entity, broker),
      );

      this.eventPublisher.emit(
        EmailEvents.Noa,
        new SendNoaEvent({
          client,
          broker,
          invoice: entity,
        }),
      );

      return ChangeActions.addTagAndActivity(
        TagDefinitionKey.CREATE_CLIENT_BROKER_ASSIGNMENT,
        Note.fromPayload(
          ActivityLogPayloadBuilder.forKey(
            TagDefinitionKey.CREATE_CLIENT_BROKER_ASSIGNMENT,
            {
              placeholders: {
                client: client.name,
                broker: broker.legalName,
              },
              data: {
                client: {
                  id: client.id,
                },
                broker: {
                  id: broker.id,
                },
              },
            },
          ),
        ),
      );
    }
    if (
      clientBrokerAssignment.status === ClientBrokerAssignmentStatus.Released
    ) {
      this.logger.debug('Updated assignment between client and broker', {
        clientId: entity.clientId,
        brokerId: entity.brokerId,
        status: ClientBrokerAssignmentStatus.Sent,
      });
      clientBrokerAssignment.status = ClientBrokerAssignmentStatus.Sent;
      this.addNoaEmailRecipientsHistory(clientBrokerAssignment, broker);
      this.addAssignmentHistory(
        clientBrokerAssignment,
        ClientBrokerAssignmentStatus.Sent,
        null,
      );
      this.eventPublisher.emit(
        EmailEvents.Noa,
        new SendNoaEvent({
          client,
          broker,
          invoice: entity,
        }),
      );
      return ChangeActions.addTagAndActivity(
        TagDefinitionKey.UPDATE_CLIENT_BROKER_ASSIGNMENT,
        Note.fromPayload(
          ActivityLogPayloadBuilder.forKey(
            TagDefinitionKey.UPDATE_CLIENT_BROKER_ASSIGNMENT,
            {
              placeholders: {
                client: client.name,
                broker: broker.legalName,
              },
              data: {
                client: {
                  id: client.id,
                },
                broker: {
                  id: broker.id,
                },
              },
            },
          ),
        ),
      );
    }
    return ChangeActions.empty();
  }

  private buildClientBrokerAssignmentEntity(
    invoice: InvoiceEntity,
    broker: Broker,
  ): ClientBrokerAssignmentEntity {
    const entity = new ClientBrokerAssignmentEntity();
    entity.clientId = invoice.clientId;
    entity.brokerId = broker.id;
    entity.status = ClientBrokerAssignmentStatus.Sent;
    entity.updatedBy = invoice.updatedBy;
    entity.createdBy = invoice.createdBy;

    this.addNoaEmailRecipientsHistory(entity, broker);
    this.addAssignmentHistory(entity, ClientBrokerAssignmentStatus.Sent, null);

    return entity;
  }

  private addAssignmentHistory(
    entity: ClientBrokerAssignmentEntity,
    status: ClientBrokerAssignmentStatus | null,
    note: string | null,
  ): void {
    const history = new ClientBrokerAssignmentAssocEntity();
    history.status = status;
    history.note = note;
    entity.assignmentHistory.add(history);
  }

  private addNoaEmailRecipientsHistory(
    entity: ClientBrokerAssignmentEntity,
    broker: Broker,
  ): void {
    const noaEmails = broker.emails.filter(
      (email) => email.type === BrokerEmailType.NOA,
    );

    noaEmails.forEach((email) => {
      this.addAssignmentHistory(
        entity,
        null,
        `NOA was emailed to: ${email.email}`,
      );
    });
  }
}
