import { BaseModel } from '@core/data';
import { TransformToBig } from '@core/decorators';
import Big from 'big.js';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export enum BatchState {
  Completed = 'completed',
  Processing = 'processing',
}

export enum TransferState {
  Completed = 'completed',
  Processing = 'processing',
  Sent = 'sent',
  Failed = 'failed',
}

export enum TransferDirection {
  Credit = 'credit',
  Debit = 'debit',
}

export enum TransferPaymentType {
  RTP = 'rtp',
  Wire = 'wire',
  ACH = 'ach',
}

export class TransferData extends BaseModel<TransferData> {
  @IsString()
  id: string;

  @IsString()
  externalId: string;

  @IsEnum(BatchState)
  state: BatchState;

  @TransformToBig()
  @Type(() => Number)
  amount: Big;

  @IsOptional()
  @IsObject()
  metadata?: object;

  @IsArray()
  @ValidateNested()
  @Type(() => PaymentTransfer)
  transfers: PaymentTransfer[];
}

export class PaymentTransfer extends BaseModel<PaymentTransfer> {
  @IsString()
  id: string;

  @IsEnum(TransferState)
  state: TransferState;

  @TransformToBig()
  @Type(() => Number)
  amount: Big;

  @IsEnum(TransferDirection)
  direction: TransferDirection;

  @IsEnum(TransferPaymentType)
  paymentType: TransferPaymentType;

  @IsString()
  originatingAccountId: string;

  @IsString()
  receivingAccountId: string;

  @IsDateString()
  createdAt: Date;

  @IsDateString()
  modifiedAt: Date;
}

enum WebhookEntityType {
  Transfer = 'Transfer',
  BatchTransfer = 'BatchTransfer',
  PlaidTransfer = 'PlaidTransfer',
}

enum WebhookTransferState {
  Pending = 'pending',
  Completed = 'completed',
  Processing = 'processing',
  Sent = 'sent',
  Failed = 'failed',
}

enum WebhookBatchTransferState {
  Pending = 'pending',
  Completed = 'completed',
  Processing = 'processing',
}

enum WebhookPlaidTransferState {
  Pending = 'pending',
  Posted = 'posted',
  Settled = 'settled',
  Canceled = 'canceled',
  Failed = 'failed',
  Returned = 'returned',
}

export type WebhookTransferType =
  `${WebhookEntityType.Transfer}.${WebhookTransferState}`;
export type WebhookBatchTransferType =
  `${WebhookEntityType.BatchTransfer}.${WebhookBatchTransferState}`;
export type WebhookPlaidTransferType =
  `${WebhookEntityType.PlaidTransfer}.${WebhookPlaidTransferState}`;

export type WebhookType =
  | WebhookTransferType
  | WebhookBatchTransferType
  | WebhookPlaidTransferType;
export class UpdateTransferStatusWebhookRequest extends BaseModel<UpdateTransferStatusWebhookRequest> {
  @IsString()
  id: string;

  @IsString()
  type: WebhookType;

  @IsDateString()
  timestamp: string;

  @ValidateNested()
  @Type(() => TransferData)
  data: TransferData;
}
