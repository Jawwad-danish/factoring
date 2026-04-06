export enum Permissions {
  SuperUser = '*',
  // Invoices
  DeleteInvoice = 'delete:invoice',
  PurchaseInvoice = 'purchase:invoice',
  RejectInvoice = 'reject:invoice',
  RevertInvoice = 'revert:invoice',
  VerifyInvoice = 'verify:invoice',
  RegenerateInvoiceDocuments = 'regenerate:invoice:documents',
  CreateInvoiceActivity = 'create:invoice:activity',
  DeleteInvoiceActivity = 'delete:invoice:activity',

  // Broker Payments
  CreateBrokerPayment = 'create:broker-payment',
  ReadBrokerPayment = 'read:broker-payment',
  UpdateBrokerPayment = 'update:broker-payment',
  DeleteBrokerPayment = 'delete:broker-payment',
  CreateBrokerPaymentNonFactored = 'create:broker-payment:non-factored',

  // Reserves
  CreateReserve = 'create:reserve',
  DeleteReserve = 'delete:reserve',

  // Reserve account funds
  CreateReserveAccountFunds = Permissions.CreateReserve,

  // User
  ResetClientPassword = 'reset:client:password',
  ResetEmployeePassword = 'reset:employee:password',
}
