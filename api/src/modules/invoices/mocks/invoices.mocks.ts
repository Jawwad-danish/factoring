import { UUID } from '@core/uuid';
import { CreateInvoiceRequest, Invoice } from '@fs-bobtail/factoring/data';
import { InvoiceEntity, InvoiceStatus } from '@module-persistence/entities';
import { EntityStubs } from '@module-persistence/test';
import Big from 'big.js';
import { UpdateInvoiceRequest } from '../data';

export const INVOICE_ID = UUID.get();
const CLIENT_ID = UUID.get();
const BROKER_ID = UUID.get();
const LOAD_NUMBER = 'bobtailv2';
const DISPLAY_ID = 'displayv2';
const STATUS = InvoiceStatus.UnderReview;
const CLIENT_PAYMENT_ID = UUID.get();
const user = EntityStubs.buildStubUser();
const userEntity = EntityStubs.buildStubUser();

const commonInvoiceFields = {
  clientId: CLIENT_ID,
  brokerId: BROKER_ID,
  loadNumber: LOAD_NUMBER,
  displayId: DISPLAY_ID,
  approvedAccountsReceivableAmount: 5555,
  transferType: 'ach',
  isBuyout: true,
  possibleDuplicate: true,
  approvedFactorFee: new Big(11),
  approvedInvoiceAdjustmentAmount: 11,
  clientTotalToPayFromInvoice: 11,
  clientPaymentId: CLIENT_PAYMENT_ID,
  status: STATUS,
  paymentIssueDate: new Date(),
  brokerPaymentDaysSinceIssue: 11,
  approvedDate: new Date(),
  paidDate: new Date(),
  declinedDate: new Date(),
  requiresVerification: false,
  skippedVerification: false,
  verified: '',
  originalBuyoutInvoiceDate: new Date(),
  buyoutPaymentDate: new Date(),
  note: 'note',
  lumper: new Big(100),
  lineHaulRate: new Big(200),
  detention: new Big(50),
  advance: new Big(50),
  deleted: false,
};

const invoice = {
  ...commonInvoiceFields,
  documents: [],
};

export const CREATE_INVOICE_REQUEST = new CreateInvoiceRequest(invoice);
export const UPDATE_INVOICE_REQUEST = new UpdateInvoiceRequest({});
export const UPDATE_REQUEST_DTO_FAIL = new UpdateInvoiceRequest({});
export const INVOICE = new Invoice({
  ...invoice,
  createdBy: user,
  updatedBy: user,
});
export const INVOICE_ENTITY: InvoiceEntity = (() => {
  const entity = new InvoiceEntity();
  Object.assign(entity, {
    ...invoice,
    createdBy: userEntity,
    updatedBy: userEntity,
    id: INVOICE_ID,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return entity;
})();
