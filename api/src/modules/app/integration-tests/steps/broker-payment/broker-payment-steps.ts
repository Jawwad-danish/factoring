import {
  CreateBrokerPaymentRequest,
  DeleteBrokerPaymentRequest,
} from '@module-broker-payments/data';
import { StepsInput } from '../step';
import { BrokerPaymentCreateSteps } from './broker-payment-create-steps';
import { BrokerPaymentDeleteSteps } from './broker-payment-delete-steps';

export class BrokerPaymentSteps {
  private readonly createSteps: BrokerPaymentCreateSteps;
  private readonly deleteSteps: BrokerPaymentDeleteSteps;

  constructor(input: StepsInput) {
    this.createSteps = new BrokerPaymentCreateSteps(input);
    this.deleteSteps = new BrokerPaymentDeleteSteps(input);
  }

  create(data?: Partial<CreateBrokerPaymentRequest>) {
    return this.createSteps.create(data);
  }

  delete(id: string, data?: Partial<DeleteBrokerPaymentRequest>) {
    return this.deleteSteps.delete(id, data);
  }
}
