import { BaseModel } from '@core/data';
import { LeadAttributionType } from '@module-persistence';
import { Expose, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsDefined,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

class CreateClientFactoringConfig extends BaseModel<CreateClientFactoringConfig> {
  @Expose()
  @IsString()
  @IsUUID()
  clientId: string;

  @Expose()
  @IsString()
  @IsUUID()
  userId: string;

  @Expose()
  @IsOptional()
  @IsString()
  @IsUUID()
  salesRepId?: string;

  @Expose()
  @IsString()
  factoringRatePercentage: string;

  @Expose()
  @IsString()
  status: string;

  @Expose()
  @IsBoolean()
  vip: boolean;

  @Expose()
  @IsBoolean()
  requiresVerification: boolean;

  @Expose()
  @IsBoolean()
  acceptedFeeIncrease: boolean;

  @Expose()
  @IsUUID()
  successTeamId: string;

  @Expose()
  @IsString()
  reserveRatePercentage: string;

  @Expose()
  @IsBoolean()
  expediteTransferOnly: boolean;

  @Expose()
  @IsBoolean()
  doneSubmittingInvoices: boolean;

  @Expose()
  @IsBoolean()
  ccInEmails: boolean;

  @IsDate()
  @Expose()
  @Type(() => Date)
  @IsDefined()
  createdAt: Date;

  @IsDate()
  @Expose()
  @Type(() => Date)
  @IsDefined()
  updatedAt: Date;

  // Insurance
  @Expose()
  @IsString()
  @IsOptional()
  insuranceAgency?: string;

  @Expose()
  @IsString()
  @IsOptional()
  insuranceCompany?: string;

  @Expose()
  @IsOptional()
  leadAttribution: LeadAttributionType | null;

  @Expose()
  @IsString()
  @IsOptional()
  insuranceMonthlyPaymentPerTruck?: string;

  @Expose()
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  insuranceRenewalDate?: Date;

  // Underwriting
  @Expose()
  @IsBoolean()
  ofacVerified: boolean;

  @Expose()
  @IsBoolean()
  carrier411Alerts: boolean;

  @Expose()
  @IsBoolean()
  taxGuardAlerts: boolean;

  // Fleet
  @Expose()
  dryvanTrucksAmount: number;

  @Expose()
  refrigeratedTrucksAmount: number;

  @Expose()
  flatbedTrucksAmount: number;

  @Expose()
  stepdeckTrucksAmount: number;

  @Expose()
  otherTrucksAmount: number;

  @Expose()
  leasedTrucksAmount: number;
}

class Employee {
  @Expose()
  firstName: null | string;

  @Expose()
  lastName: null | string;
}

class Client {
  @Expose()
  shortenedName: null | string;
}

class CreateUser extends BaseModel<CreateUser> {
  @Expose()
  @IsString()
  @IsUUID()
  id: string;

  @Expose()
  @IsString()
  email: string;

  @Expose()
  @Type(() => Client)
  @IsDefined()
  client: Client;

  @Expose()
  @Type(() => Employee)
  @IsDefined()
  employee: Employee;

  @IsDate()
  @Expose()
  @Type(() => Date)
  @IsDefined()
  createdAt: Date;

  @IsDate()
  @Expose()
  @Type(() => Date)
  @IsDefined()
  updatedAt: Date;
}

export class CreateClientFactoringConfigRequest extends BaseModel<CreateClientFactoringConfigRequest> {
  @Expose()
  @Type(() => CreateClientFactoringConfig)
  @IsDefined()
  @ValidateNested()
  client: CreateClientFactoringConfig;

  @Expose()
  @Type(() => CreateUser)
  @IsDefined()
  @ValidateNested()
  user: CreateUser;
}
