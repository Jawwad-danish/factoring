import { BrokerPaymentSteps } from './broker-payment';
import { BuyoutSteps } from './buyouts';
import { ClientPaymentsSteps } from './client-payments';
import { ClientsSteps } from './clients';
import { FirebaseTokenSteps } from './firebase-token';
import { InvoiceSteps } from './invoice';
import { ReserveAccountFundsSteps } from './reserve-account-funds';
import { ReserveSteps } from './reserves';
import { StepsInput } from './step';
import { TransfersSteps } from './transfers';
import { UsersSteps } from './users';

export class IntegrationTestsSteps {
  readonly invoice: InvoiceSteps;
  readonly brokerPayment: BrokerPaymentSteps;
  readonly reserve: ReserveSteps;
  readonly buyout: BuyoutSteps;
  readonly transfers: TransfersSteps;
  readonly clients: ClientsSteps;
  readonly reserveAccountFunds: ReserveAccountFundsSteps;
  readonly clientPayments: ClientPaymentsSteps;
  readonly firebaseToken: FirebaseTokenSteps;
  readonly users: UsersSteps;

  constructor(appManager: StepsInput) {
    this.invoice = new InvoiceSteps(appManager);
    this.brokerPayment = new BrokerPaymentSteps(appManager);
    this.reserve = new ReserveSteps(appManager);
    this.buyout = new BuyoutSteps(appManager);
    this.transfers = new TransfersSteps(appManager);
    this.clients = new ClientsSteps(appManager);
    this.reserveAccountFunds = new ReserveAccountFundsSteps(appManager);
    this.clientPayments = new ClientPaymentsSteps(appManager);
    this.firebaseToken = new FirebaseTokenSteps(appManager);
    this.users = new UsersSteps(appManager);
  }
}
