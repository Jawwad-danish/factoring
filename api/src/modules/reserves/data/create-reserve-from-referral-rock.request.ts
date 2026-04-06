import { Expose, Type } from 'class-transformer';
import { IsDate, IsNumber, IsOptional, IsUUID } from 'class-validator';

export class CreateReserveFromReferralRockRequest {
  @IsUUID()
  @Expose()
  Id: string;

  @IsUUID()
  @Expose()
  ClientId: string;

  @IsUUID()
  @Expose()
  PayoutId: string;

  @Expose()
  PayoutDescription: string | null;

  @Expose()
  CurrencyCode: string | null;

  @IsUUID()
  @Expose()
  ProgramId: string;

  @Expose()
  ProgramName: string;

  @IsUUID()
  @Expose()
  MemberId: string;

  @Expose()
  ReferralId: string | null;

  @Expose()
  Type: string | null;

  @Expose()
  RecipientId: string | null;

  @Expose()
  RecipientName: string | null;

  @Expose()
  RecipientEmailAddress: string | null;

  @Expose()
  RecipientExternalIdentifier: string;

  @Expose()
  Status: string | null;

  @IsNumber()
  @Expose()
  Source: number;

  @IsNumber()
  @Expose()
  Amount: number;

  @IsDate()
  @Type(() => Date)
  @Expose()
  CreateDate: Date;

  @Expose()
  IssueDate: Date | null;

  @Expose()
  EligibilityDate: Date | null;

  @Expose()
  Description: string | null;

  @IsOptional()
  @IsUUID()
  @Expose()
  TransactionID?: string | null;

  @Expose()
  UpdateDate: Date | null;

  @Expose()
  ReferralDisplayName: string | null;

  @Expose()
  ReferralEmail: string | null;

  @Expose()
  ProgramRewardRuleDisplayName: string | null;

  @Expose()
  ProgramRewardRuleId: string | null;

  @Expose()
  RecurringRewardEnrollmentId: string | null;

  @Expose()
  ExternalIdentifier: string | null;

  @Expose()
  PaymentType: string | null;

  @Expose()
  PaymentStatus: string | null;

  @Expose()
  PaymentCode: string | null;

  @Expose()
  CompleteNote: string | null;

  @Expose()
  Timestamp: number;

  @Expose()
  PayoutType: string | null;

  @Expose()
  PayoutMetadata: string | null;

  @Expose()
  ReferralFullName: string | null;
}
