import { QueryCriteria } from '@core/data';
import {
  InitiateDebitRegularTransferRequest,
  InitiateExpediteTransferRequest,
  InitiateRegularTransferRequest,
  UpdateTransferStatusWebhookRequest,
} from '@module-transfers/data';
import { HttpStatus } from '@nestjs/common';
import { StepsInput } from '../step';
import { TransfersCreateSteps } from './transfers-create-steps';
import { TransfersFetchSteps } from './transfers-fetch-steps';
import { TransfersWebhookSteps } from './transfers-webhooks-steps';

export class TransfersSteps {
  private readonly fetchSteps: TransfersFetchSteps;
  private readonly createSteps: TransfersCreateSteps;
  private readonly webhookSteps: TransfersWebhookSteps;

  constructor(input: StepsInput) {
    this.fetchSteps = new TransfersFetchSteps(input);
    this.createSteps = new TransfersCreateSteps(input);
    this.webhookSteps = new TransfersWebhookSteps(input);
  }

  upcomingExpedites() {
    return this.fetchSteps.upcomingExpedites();
  }

  upcomingRegulars() {
    return this.fetchSteps.upcomingRegulars();
  }

  completedTransfers(query?: Partial<QueryCriteria>) {
    return this.fetchSteps.completedTransfers(query);
  }

  initiateExpedite(payload: InitiateExpediteTransferRequest) {
    return this.createSteps.initiateExpedite(payload);
  }

  updateTransferStatus(payload: UpdateTransferStatusWebhookRequest) {
    return this.webhookSteps.updateTransferStatus(payload);
  }

  initiateRegular(
    payload?: InitiateRegularTransferRequest,
    expectedStatus?: HttpStatus,
  ) {
    return this.createSteps.initiateRegular(payload, expectedStatus);
  }

  initiateDebitRegular(
    payload?: InitiateDebitRegularTransferRequest,
    expectedStatus?: HttpStatus,
  ) {
    return this.createSteps.initiateDebitRegular(payload, expectedStatus);
  }
}
