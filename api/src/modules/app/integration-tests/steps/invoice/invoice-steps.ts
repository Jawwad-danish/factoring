import { QueryCriteria } from '@core/data';
import {
  AssignInvoiceActivityRequest,
  PurchaseInvoiceRequest,
  RejectInvoiceRequest,
  RevertInvoiceRequest,
  UpdateInvoiceRequest,
  VerifyInvoiceRequest,
} from '@module-invoices';
import { StepsInput } from '../step';
import {
  InvoiceCreateExpects,
  InvoiceCreateSteps,
} from './invoice-create-steps';
import { InvoiceDeleteSteps } from './invoice-delete-steps';
import { InvoiceDocumentGenerationSteps } from './invoice-document-generation-steps';
import { InvoiceDuplicateDetectionSteps } from './invoice-duplicate-detection-steps';
import { InvoiceFetchSteps } from './invoice-fetch-steps';
import { InvoicePaySteps } from './invoice-pay-steps';
import { InvoicePurchaseSteps } from './invoice-purchase-steps';
import { InvoiceRejectSteps } from './invoice-reject-steps';
import { InvoiceRevertSteps } from './invoice-revert-steps';
import { InvoiceTagSteps } from './invoice-tag-steps';
import { InvoiceUpdateSteps } from './invoice-update-steps';
import { InvoiceVerificationSteps } from './invoice-verification-steps';
import { CreateInvoiceRequest } from '@fs-bobtail/factoring/data';

export class InvoiceSteps {
  private readonly createSteps: InvoiceCreateSteps;
  private readonly tagSteps: InvoiceTagSteps;
  private readonly fetchSteps: InvoiceFetchSteps;
  private readonly verificationSteps: InvoiceVerificationSteps;
  private readonly deleteSteps: InvoiceDeleteSteps;
  private readonly updateSteps: InvoiceUpdateSteps;
  private readonly purchaseSteps: InvoicePurchaseSteps;
  private readonly rejectSteps: InvoiceRejectSteps;
  private readonly revertSteps: InvoiceRevertSteps;
  private readonly duplicateDetectionSteps: InvoiceDuplicateDetectionSteps;
  private readonly paySteps: InvoicePaySteps;
  private readonly documentGenerationSteps: InvoiceDocumentGenerationSteps;

  constructor(appManager: StepsInput) {
    this.createSteps = new InvoiceCreateSteps(appManager);
    this.tagSteps = new InvoiceTagSteps(appManager);
    this.fetchSteps = new InvoiceFetchSteps(appManager);
    this.verificationSteps = new InvoiceVerificationSteps(appManager);
    this.deleteSteps = new InvoiceDeleteSteps(appManager);
    this.updateSteps = new InvoiceUpdateSteps(appManager);
    this.purchaseSteps = new InvoicePurchaseSteps(appManager);
    this.rejectSteps = new InvoiceRejectSteps(appManager);
    this.revertSteps = new InvoiceRevertSteps(appManager);
    this.duplicateDetectionSteps = new InvoiceDuplicateDetectionSteps(
      appManager,
    );
    this.paySteps = new InvoicePaySteps(appManager);
    this.documentGenerationSteps = new InvoiceDocumentGenerationSteps(
      appManager,
    );
  }

  create(data?: Partial<CreateInvoiceRequest>, expects?: InvoiceCreateExpects) {
    return this.createSteps.create(data, expects);
  }

  failInvoiceCreate(data?: Partial<CreateInvoiceRequest>) {
    return this.createSteps.failCreate(data);
  }

  async createAndPurchase(data?: Partial<CreateInvoiceRequest>) {
    const invoice = await this.create(data);
    await this.verify(invoice.id);
    return await this.purchase(invoice.id);
  }

  async createAndSendPayment(data?: Partial<CreateInvoiceRequest>) {
    const invoice = await this.createAndPurchase(data);
    return await this.sendPayment(invoice.id);
  }

  async createAndCompletePayment(data?: Partial<CreateInvoiceRequest>) {
    const invoice = await this.createAndPurchase(data);
    return await this.completePayment(invoice.id);
  }

  assignTag(id: string, data?: Partial<AssignInvoiceActivityRequest>) {
    return this.tagSteps.assign(id, data);
  }

  deleteActivity(invoiceId: string, activityId: string) {
    return this.tagSteps.delete(invoiceId, activityId);
  }

  getAll(query?: Partial<QueryCriteria>) {
    return this.fetchSteps.getAll(query);
  }

  getOne(id: string) {
    return this.fetchSteps.getOne(id);
  }

  getRisk(id: string) {
    return this.fetchSteps.getRisk(id);
  }

  getOneDeleted(id: string) {
    return this.fetchSteps.getOneDeleted(id);
  }

  verify(id: string, data?: Partial<VerifyInvoiceRequest>) {
    return this.verificationSteps.verify(id, data);
  }

  delete(id: string) {
    return this.deleteSteps.delete(id);
  }

  update(id: string, data?: Partial<UpdateInvoiceRequest>) {
    return this.updateSteps.update(id, data);
  }

  failUpdate(id: string, data?: Partial<UpdateInvoiceRequest>) {
    return this.updateSteps.failUpdate(id, data);
  }

  purchase(id: string, data?: Partial<PurchaseInvoiceRequest>) {
    return this.purchaseSteps.purchase(id, data);
  }

  reject(id: string, data?: Partial<RejectInvoiceRequest>) {
    return this.rejectSteps.reject(id, data);
  }

  revert(id: string, data?: Partial<RevertInvoiceRequest>) {
    return this.revertSteps.revert(id, data);
  }

  checkPossibleDuplicate(request: CreateInvoiceRequest) {
    return this.duplicateDetectionSteps.checkPossibleDuplicate(request);
  }

  sendPayment(id: string) {
    return this.paySteps.sendPayment(id);
  }

  completePayment(id: string) {
    return this.paySteps.completePayment(id);
  }

  startDocumentGeneration(id: string) {
    return this.documentGenerationSteps.startDocumentGeneration(id);
  }

  failDocumentGeneration(id: string) {
    return this.documentGenerationSteps.failDocumentGeneration(id);
  }
}
