export enum PaymentType {
  ACH = 'ach',
  WIRE = 'wire',
  RTP = 'rtp',
  DEBIT = 'ach-debit',
}

export enum PaymentStatus {
  PENDING = 'pending',
  DONE = 'done',
  FAILED = 'failed',
}
