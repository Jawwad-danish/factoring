import { V1AwareBaseModel } from '@core/data';
import { IsBigRange, TransformToBig } from '@core/decorators';
import {
  ClientFactoringRateReason,
  ClientFactoringStatus,
  ClientReserveRateReason,
  ClientStatusReason,
  LeadAttributionType,
} from '@module-persistence';
import Big from 'big.js';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';

export class UpdateClientFactoringConfigRequest extends V1AwareBaseModel<UpdateClientFactoringConfigRequest> {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @TransformToBig()
  @Type(() => String)
  verificationPercentage?: Big;

  @IsOptional()
  @TransformToBig()
  @Type(() => String)
  factoringRatePercentage?: Big;

  @ValidateIf((obj) => obj.clientLimitNote != null)
  @Type(() => String)
  @TransformToBig()
  @IsBigRange({ min: 250000, allowNull: true })
  clientLimitAmount?: null | Big;

  @ValidateIf((obj) => obj.clientLimitAmount != null)
  @IsString()
  clientLimitNote?: string;

  @IsOptional()
  @IsString()
  paymentPlan?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsEnum(ClientFactoringStatus)
  status?: ClientFactoringStatus;

  @IsOptional()
  @IsEnum(ClientStatusReason)
  statusReason?: ClientStatusReason;

  @IsOptional()
  @IsBoolean()
  vip?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresVerification?: boolean;

  @IsOptional()
  @IsEnum(LeadAttributionType)
  leadAttribution?: LeadAttributionType;

  @IsOptional()
  @IsBoolean()
  acceptedFeeIncrease?: boolean;

  @IsOptional()
  @IsUUID()
  successTeamId?: string;

  @IsOptional()
  @IsUUID()
  salesRepId?: string;

  @IsOptional()
  @IsIn([
    ClientFactoringRateReason.RateCorrection,
    ClientFactoringRateReason.LowerRateRequest,
    ClientFactoringRateReason.RateIncrease,
  ])
  factoringRateReason?: ClientFactoringRateReason;

  @IsOptional()
  @IsEnum(ClientReserveRateReason)
  reserveRateReason?: ClientReserveRateReason;

  @IsOptional()
  @TransformToBig()
  @Type(() => String)
  reserveRatePercentage?: Big;

  @IsOptional()
  @IsBoolean()
  expediteTransferOnly?: boolean;

  @IsOptional()
  @IsBoolean()
  doneSubmittingInvoices?: boolean;

  @IsOptional()
  @IsBoolean()
  ccInEmails?: boolean;

  // Insurance
  @IsOptional()
  @IsString()
  insuranceAgency?: string;

  @IsOptional()
  @IsString()
  insuranceCompany?: string;

  @IsOptional()
  @TransformToBig()
  @Type(() => String)
  insuranceMonthlyPaymentPerTruck?: Big;

  @IsOptional()
  @Type(() => Date)
  insuranceRenewalDate?: Date;

  // Underwriting
  @IsOptional()
  @IsBoolean()
  ofacVerified?: boolean;

  @IsOptional()
  @IsBoolean()
  carrier411Alerts?: boolean;

  @IsOptional()
  @IsBoolean()
  taxGuardAlerts?: boolean;

  // Fleet
  @IsOptional()
  dryvanTrucksAmount?: number;

  @IsOptional()
  refrigeratedTrucksAmount?: number;

  @IsOptional()
  flatbedTrucksAmount?: number;

  @IsOptional()
  stepdeckTrucksAmount?: number;

  @IsOptional()
  otherTrucksAmount?: number;

  @IsOptional()
  leasedTrucksAmount?: number;
}
