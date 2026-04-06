import {
  CreateBuyoutsBatchRequest,
  UpdateBuyoutRequest,
} from '@fs-bobtail/factoring/data';
import { StepsInput } from '../step';
import { BuyoutCreateSteps } from './buyout-create-steps';
import { BuyoutDeleteSteps } from './buyout-delete-steps';
import { BuyoutsFetchSteps } from './buyout-fetch-steps';
import { BuyoutUpdateSteps } from './buyout-update-steps';

export class BuyoutSteps {
  private readonly fetchSteps: BuyoutsFetchSteps;
  private readonly deleteSteps: BuyoutDeleteSteps;
  private readonly createSteps: BuyoutCreateSteps;
  private readonly updateSteps: BuyoutUpdateSteps;

  constructor(input: StepsInput) {
    this.fetchSteps = new BuyoutsFetchSteps(input);
    this.deleteSteps = new BuyoutDeleteSteps(input);
    this.createSteps = new BuyoutCreateSteps(input);
    this.updateSteps = new BuyoutUpdateSteps(input);
  }

  getAll() {
    return this.fetchSteps.getAll();
  }

  getOneDeleted(id: string) {
    return this.fetchSteps.getOneDeleted(id);
  }

  delete(id: string) {
    return this.deleteSteps.delete(id);
  }

  createBatch(data?: Partial<CreateBuyoutsBatchRequest>) {
    return this.createSteps.create(data);
  }

  bulkPurchase() {
    return this.createSteps.bulkPurchase();
  }

  update(id: string, data: Partial<UpdateBuyoutRequest>) {
    return this.updateSteps.update(id, data);
  }
}
