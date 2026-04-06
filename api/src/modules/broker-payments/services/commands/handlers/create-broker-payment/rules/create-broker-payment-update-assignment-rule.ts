import { ActivityLogPayloadBuilder, ChangeActions } from '@common';
import { Note } from '@core/data';
import {
  ClientBrokerAssignmentAssocEntity,
  ClientBrokerAssignmentStatus,
  TagDefinitionKey,
} from '@module-persistence/entities';
import { ClientBrokerAssignmentRepository } from '@module-persistence/repositories';
import { Injectable, Logger } from '@nestjs/common';
import {
  BrokerPaymentContext,
  CreateBrokerPaymentRequest,
} from '../../../../../data';
import { BrokerPaymentRule } from '../../../../common/rules';
import { BrokerService } from '@module-brokers';
import { ClientService } from '@module-clients';

@Injectable()
export class CreateBrokerPaymentUpdateAssignmentRule
  implements BrokerPaymentRule<CreateBrokerPaymentRequest>
{
  private logger = new Logger(CreateBrokerPaymentUpdateAssignmentRule.name);
  constructor(
    private readonly repository: ClientBrokerAssignmentRepository,
    private clientService: ClientService,
    private brokerService: BrokerService,
  ) {}

  async run(
    context: BrokerPaymentContext<CreateBrokerPaymentRequest>,
  ): Promise<ChangeActions> {
    const { brokerPayment: entity, invoice } = context;

    if (!invoice.brokerId) {
      this.logger.error('Skipping because the broker id is not set', {
        clientId: invoice.clientId,
      });
      return ChangeActions.empty();
    }

    if (entity.amount.eq(0)) {
      this.logger.debug('Skipping because non-payment', {
        clientId: invoice.clientId,
        brokerId: invoice.brokerId,
      });
      return ChangeActions.empty();
    }

    const assignment = await this.repository.findOne(
      invoice.clientId,
      invoice.brokerId,
    );

    if (assignment == null) {
      this.logger.error('Skipping because assignment was not found', {
        brokerPaymentId: entity.id,
        brokerId: invoice.brokerId,
        clientId: invoice.clientId,
      });
      return ChangeActions.empty();
    }

    if (assignment.status === ClientBrokerAssignmentStatus.Verified) {
      this.logger.debug('Skipping because assignment is already verified', {
        brokerPaymentId: entity.id,
        brokerId: invoice.brokerId,
        clientId: invoice.clientId,
      });
      return ChangeActions.empty();
    }

    assignment.status = ClientBrokerAssignmentStatus.Verified;
    const history = new ClientBrokerAssignmentAssocEntity();
    history.status = ClientBrokerAssignmentStatus.Verified;
    assignment.assignmentHistory.add(history);

    this.logger.debug('Updating client broker assignment to verified', {
      brokerPaymentId: entity.id,
      brokerId: invoice.brokerId,
      clientId: invoice.clientId,
    });
    entity.invoice = invoice;
    const [client, broker] = await Promise.all([
      this.clientService.getOneById(invoice.clientId),
      this.brokerService.findOneById(invoice.brokerId),
    ]);

    if (!broker) {
      this.logger.error('Broker not found to update client broker assignment', {
        brokerId: invoice.brokerId,
        brokerPaymentId: entity.id,
        clientId: invoice.clientId,
      });
      return ChangeActions.empty();
    }

    return ChangeActions.addActivity(
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
                id: invoice.clientId,
              },
              broker: {
                id: invoice.brokerId,
              },
            },
          },
        ),
      ),
    );
  }
}
