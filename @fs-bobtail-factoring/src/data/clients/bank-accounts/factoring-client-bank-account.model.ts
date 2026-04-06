import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ClientBankAccount } from './client-bank-account.model';

export enum SupportedPaymentMethod {
  Wire = 'wire',
  Ach = 'ach',
  Rtp = 'rtp',
}

export enum BankAccountIssues {
  PendingVerification = 'PENDING_VERIFICATION',
  VerificationExpired = 'VERIFICATION_EXPIRED',
  PendingMicroDeposits = 'PENDING_MICRO_DEPOSITS',
  RequiresWireRoutingNumber = 'REQUIRES_WIRE_ROUTING_NUMBER',
  MissingBankName = 'MISSING_BANK_NAME',
}

export class FactoringBankAccount extends ClientBankAccount {
  @Expose()
  @ApiProperty({
    enum: SupportedPaymentMethod,
    isArray: true,
    description: 'Supported payment methods for this factoring account',
    example: ['wire', 'ach'],
    required: true,
  })
  supportedPaymentMethods!: SupportedPaymentMethod[];

  @Expose()
  @ApiProperty({
    enum: BankAccountIssues,
    isArray: true,
    description: 'Issues with this bank account',
    example: ['PENDING_VERIFICATION', 'VERIFICATION_EXPIRED'],
    required: true,
  })
  issues!: BankAccountIssues[];
}
