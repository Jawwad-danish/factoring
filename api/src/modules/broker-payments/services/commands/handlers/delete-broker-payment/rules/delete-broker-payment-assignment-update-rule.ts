import { ChangeActions } from '@common';
import { Note } from '@core/data';
import { CrossCuttingConcerns } from '@core/util';
import {
  ClientBrokerAssignmentAssocEntity,
  ClientBrokerAssignmentStatus,
  TagDefinitionKey,
} from '@module-persistence';
import {
  BrokerPaymentRepository,
  ClientBrokerAssignmentRepository,
} from '@module-persistence/repositories';
import { Injectable } from '@nestjs/common';
import {
  BrokerPaymentContext,
  CreateBrokerPaymentRequest,
  DeleteBrokerPaymentRequest,
} from '../../../../../data';
import { BrokerPaymentRule } from '../../../../common/rules';

@Injectable()
export class DeleteBrokerPaymentUpdateAssignmentRule
  implements BrokerPaymentRule<DeleteBrokerPaymentRequest>
{
  constructor(
    private readonly clientBrokerAssignmentRepository: ClientBrokerAssignmentRepository,
    private readonly brokerPaymentRepository: BrokerPaymentRepository,
  ) {}
  @CrossCuttingConcerns({
    logging: ({
      brokerPayment,
    }: BrokerPaymentContext<DeleteBrokerPaymentRequest>) => {
      return {
        message: `Updating client broker assignment due to broker payment deletion`,
        payload: {
          brokerPaymentId: brokerPayment.id,
        },
      };
    },
  })
  async run(
    context: BrokerPaymentContext<CreateBrokerPaymentRequest>,
  ): Promise<ChangeActions> {
    const { brokerPayment, invoice } = context;
    const brokerPayments =
      await this.brokerPaymentRepository.getAllByClientAndBrokerId(
        invoice.clientId,
        invoice.brokerId as string,
      );
    const isAssignmentStatusCorrect = brokerPayments.some(
      (payment) => payment.amount.gt(0) && payment.id !== brokerPayment.id,
    );
    if (!isAssignmentStatusCorrect) {
      const assignment = await this.clientBrokerAssignmentRepository.getOne(
        invoice.clientId,
        invoice.brokerId as string,
      );
      assignment.status = ClientBrokerAssignmentStatus.Sent;
      const history = new ClientBrokerAssignmentAssocEntity();
      history.status = ClientBrokerAssignmentStatus.Sent;
      assignment.assignmentHistory.add(history);
      return ChangeActions.addActivity(
        TagDefinitionKey.UPDATE_CLIENT_BROKER_ASSIGNMENT,
        Note.fromText(
          `Assignment moved back to ${ClientBrokerAssignmentStatus.Sent} due to insuffiecient valid broker payments`,
        ),
      );
    }
    return ChangeActions.empty();
  }
}
