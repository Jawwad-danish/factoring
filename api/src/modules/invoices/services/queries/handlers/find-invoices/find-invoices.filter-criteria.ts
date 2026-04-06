import { BaseModel, FilterOperator } from '@core/data';
import {
  IsBigRange,
  TransformToBig,
  TransformToBoolean,
  TransformToString,
} from '@core/decorators';
import {
  BrokerPaymentStatus,
  ClientFactoringStatus,
  ClientPaymentStatus,
  InvoiceStatus,
  TagDefinitionGroupKey,
  TagDefinitionKey,
  VerificationStatus,
} from '@module-persistence/entities';
import { Big } from 'big.js';
import { Exclude, Expose, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsDefined,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
export class VipFilterCriteria extends BaseModel<VipFilterCriteria> {
  @Expose()
  @IsBoolean()
  @TransformToBoolean()
  value: boolean;

  @Expose()
  @IsEnum(FilterOperator)
  @IsIn([FilterOperator.EQ])
  operator: FilterOperator;
}

export class InvoiceValueCriteria extends BaseModel<InvoiceValueCriteria> {
  @Expose()
  @TransformToBig()
  @Type(() => String)
  value: Big;

  @Expose()
  @IsEnum(FilterOperator)
  @IsIn([FilterOperator.GTE, FilterOperator.LTE])
  operator: FilterOperator;
}

export class LoadNumberCriteria extends BaseModel<LoadNumberCriteria> {
  @Expose()
  @IsDefined()
  @TransformToString()
  value: string;

  @Expose()
  @IsEnum(FilterOperator)
  @IsIn([FilterOperator.EQ, FilterOperator.ILIKE])
  operator: FilterOperator;
}

export class DisplayIdCriteria extends BaseModel<DisplayIdCriteria> {
  @Expose()
  @IsDefined()
  value: string;

  @Expose()
  @IsEnum(FilterOperator)
  @IsIn([FilterOperator.EQ, FilterOperator.ILIKE])
  operator: FilterOperator;
}

export class NonpaymentFilterCriteria extends BaseModel<NonpaymentFilterCriteria> {
  @Expose()
  @IsDate()
  @Type(() => Date)
  value: Date;

  @Expose()
  @IsEnum(FilterOperator)
  @IsIn([FilterOperator.GT])
  operator: FilterOperator;
}

export class InactiveClientsFilterCriteria extends BaseModel<InactiveClientsFilterCriteria> {
  @Expose()
  @IsBoolean()
  @TransformToBoolean()
  value: boolean;

  @Expose()
  @IsEnum(FilterOperator)
  @IsIn([FilterOperator.EQ])
  operator: FilterOperator;
}

export class OutstandingFilterCriteria extends BaseModel<OutstandingFilterCriteria> {
  @Expose()
  @IsDate()
  @Type(() => Date)
  value: Date;

  @Expose()
  @IsEnum(FilterOperator)
  @IsIn([FilterOperator.LT, FilterOperator.GT])
  operator: FilterOperator;
}

export class SuccessTeamFilterCriteria extends BaseModel<SuccessTeamFilterCriteria> {
  @Expose()
  @IsUUID(4, { each: true })
  value: string | string[];

  @Expose()
  @IsEnum(FilterOperator)
  @IsIn([FilterOperator.IN, FilterOperator.EQ])
  operator: FilterOperator;
}

export class ClientIdFilterCriteria extends BaseModel<ClientIdFilterCriteria> {
  @Expose()
  @IsUUID(4, { each: true })
  value: string | string[];

  @Expose()
  @IsEnum(FilterOperator)
  @IsIn([FilterOperator.EQ, FilterOperator.IN])
  operator: FilterOperator;
}

export enum TransferTypeFilterCriteria {
  FirstAch = 'first_ach',
  SecondAch = 'second_ach',
  Expedited = 'expedited',
}

export class BrokerTagCriteria extends BaseModel<BrokerTagCriteria> {
  @Expose()
  @IsString()
  value: string;

  @Expose()
  @IsEnum(FilterOperator)
  @IsIn([FilterOperator.EQ])
  operator: FilterOperator;
}

export class BuyoutFilterCriteria extends BaseModel<BuyoutFilterCriteria> {
  @Expose()
  @IsBoolean()
  @TransformToBoolean()
  value: boolean;

  @Expose()
  @IsEnum(FilterOperator)
  @IsIn([FilterOperator.NOTNULL])
  operator: FilterOperator;
}

export class FlaggedFilterCriteria extends BaseModel<FlaggedFilterCriteria> {
  @Expose()
  @IsBoolean()
  @TransformToBoolean()
  value: boolean;

  @Expose()
  @IsEnum(FilterOperator)
  @IsIn([FilterOperator.NOTNULL])
  operator: FilterOperator;
}

export class TransferFilterCriteria extends BaseModel<TransferFilterCriteria> {
  @Expose()
  @IsEnum(TransferTypeFilterCriteria)
  value: TransferTypeFilterCriteria;

  @Expose()
  @IsEnum(FilterOperator)
  @IsIn([FilterOperator.EQ])
  operator: FilterOperator;
}

export class ClientOperatingBalanceCriteria extends BaseModel<ClientOperatingBalanceCriteria> {
  @Expose()
  @TransformToBig()
  @IsBigRange({ min: 0, max: 10_000_000 })
  value: Big;

  @Expose()
  @IsEnum(FilterOperator)
  @IsIn([FilterOperator.LTE, FilterOperator.GTE])
  operator: FilterOperator;
}

export class InvoiceTagsCriteria extends BaseModel<InvoiceTagsCriteria> {
  @Expose()
  @IsString({ each: true })
  @Type(() => String)
  value: TagDefinitionKey | TagDefinitionKey[];

  @Expose()
  @IsEnum(FilterOperator)
  @IsIn([
    FilterOperator.EQ,
    FilterOperator.IN,
    FilterOperator.NIN,
    FilterOperator.NULL,
  ])
  operator: FilterOperator;
}

export class InvoiceTagGroupsCriteria extends BaseModel<InvoiceTagGroupsCriteria> {
  @Expose()
  @IsString({ each: true })
  @Type(() => String)
  value: TagDefinitionGroupKey | TagDefinitionGroupKey[];

  @Expose()
  @IsEnum(FilterOperator)
  @IsIn([
    FilterOperator.EQ,
    FilterOperator.IN,
    FilterOperator.NIN,
    FilterOperator.NULL,
  ])
  operator: FilterOperator;
}

export class IdFilterCriteria extends BaseModel<IdFilterCriteria> {
  @Expose()
  @IsUUID(4, { each: true })
  value: string | string[];

  @Expose()
  @IsEnum(FilterOperator)
  @IsIn([FilterOperator.IN, FilterOperator.EQ])
  operator: FilterOperator;
}

export class StatusFilterCriteria extends BaseModel<StatusFilterCriteria> {
  @Expose()
  @IsEnum(InvoiceStatus, { each: true })
  value: InvoiceStatus | InvoiceStatus[];

  @Expose()
  @IsEnum(FilterOperator)
  @IsIn([FilterOperator.EQ, FilterOperator.IN])
  operator: FilterOperator;
}

export class CreatedAtFilterCriteria extends BaseModel<CreatedAtFilterCriteria> {
  @Expose()
  @IsDate()
  @Type(() => Date)
  value: Date;

  @Expose()
  @IsEnum(FilterOperator)
  @IsIn([
    FilterOperator.GT,
    FilterOperator.LT,
    FilterOperator.GTE,
    FilterOperator.LTE,
  ])
  operator: FilterOperator;
}

export class BrokerIdFilterCriteria extends BaseModel<BrokerIdFilterCriteria> {
  @Expose()
  @IsUUID(4, { each: true })
  value: string | string[] | null;

  @Expose()
  @IsEnum(FilterOperator)
  @IsIn([FilterOperator.EQ, FilterOperator.NULL, FilterOperator.IN])
  operator: FilterOperator;
}

export class VerificationStatusFilterCriteria extends BaseModel<VerificationStatusFilterCriteria> {
  @Expose()
  @IsEnum(VerificationStatus, { each: true })
  value: VerificationStatus | VerificationStatus[];

  @Expose()
  @IsEnum(FilterOperator)
  @IsIn([FilterOperator.IN])
  operator: FilterOperator;
}

export class BrokerPaymentStatusFilterCriteria extends BaseModel<BrokerPaymentStatusFilterCriteria> {
  @Expose()
  @IsEnum(BrokerPaymentStatus, { each: true })
  value: BrokerPaymentStatus | BrokerPaymentStatus[];

  @Expose()
  @IsEnum(FilterOperator)
  @IsIn([FilterOperator.EQ, FilterOperator.IN, FilterOperator.NIN])
  operator: FilterOperator;
}

export class ClientPaymentStatusFilterCriteria extends BaseModel<ClientPaymentStatusFilterCriteria> {
  @Expose()
  @IsEnum(ClientPaymentStatus, { each: true })
  value: ClientPaymentStatus | ClientPaymentStatus[];

  @Expose()
  @IsEnum(FilterOperator)
  @IsIn([
    FilterOperator.EQ,
    FilterOperator.NE,
    FilterOperator.IN,
    FilterOperator.NIN,
  ])
  operator: FilterOperator;
}

export class PurchasedDateFilterCriteria extends BaseModel<PurchasedDateFilterCriteria> {
  @Expose()
  @IsDate()
  @Type(() => Date)
  value: Date;

  @Expose()
  @IsEnum(FilterOperator)
  @IsIn([FilterOperator.GT, FilterOperator.LT])
  operator: FilterOperator;
}

export class RejectedDateFilterCriteria extends BaseModel<RejectedDateFilterCriteria> {
  @Expose()
  @IsDate()
  @Type(() => Date)
  value: Date;

  @Expose()
  @IsEnum(FilterOperator)
  @IsIn([FilterOperator.GT, FilterOperator.LT])
  operator: FilterOperator;
}

export class PaymentDateFilterCriteria extends BaseModel<PaymentDateFilterCriteria> {
  @Expose()
  @IsDate()
  @Type(() => Date)
  value: Date;

  @Expose()
  @IsEnum(FilterOperator)
  @IsIn([FilterOperator.GT, FilterOperator.LT])
  operator: FilterOperator;
}

export class HasIssuesFilterCriteria extends BaseModel<HasIssuesFilterCriteria> {
  @Expose()
  @IsBoolean()
  @TransformToBoolean()
  value: boolean;

  @Expose()
  @IsEnum(FilterOperator)
  @IsIn([FilterOperator.EQ])
  operator: FilterOperator;
}

export class IsDirtyFilterCriteria extends BaseModel<IsDirtyFilterCriteria> {
  @Expose()
  @IsBoolean()
  @TransformToBoolean()
  value: boolean;

  @Expose()
  @IsEnum(FilterOperator)
  @IsIn([FilterOperator.EQ])
  operator: FilterOperator;
}

export class ExpeditedFilterCriteria extends BaseModel<ExpeditedFilterCriteria> {
  @Expose()
  @IsBoolean()
  @TransformToBoolean()
  value: boolean;

  @Expose()
  @IsEnum(FilterOperator)
  @IsIn([FilterOperator.EQ])
  operator: FilterOperator;
}

export class ClientStatusFilterCriteria extends BaseModel<ClientStatusFilterCriteria> {
  @Expose()
  @IsEnum(ClientFactoringStatus, { each: true })
  value: ClientFactoringStatus | ClientFactoringStatus[];

  @Expose()
  @IsEnum(FilterOperator)
  @IsIn([FilterOperator.IN, FilterOperator.EQ])
  operator: FilterOperator;
}

@Exclude()
export class FindInvoiceFilterCriteria extends BaseModel<FindInvoiceFilterCriteria> {
  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => IdFilterCriteria)
  id?: IdFilterCriteria;

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => StatusFilterCriteria)
  status?: StatusFilterCriteria;

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => CreatedAtFilterCriteria)
  createdAt?: CreatedAtFilterCriteria | CreatedAtFilterCriteria[];

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => BrokerIdFilterCriteria)
  brokerId?: BrokerIdFilterCriteria;

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => VerificationStatusFilterCriteria)
  verificationStatus?: VerificationStatusFilterCriteria;

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => BrokerPaymentStatusFilterCriteria)
  brokerPaymentStatus?: BrokerPaymentStatusFilterCriteria;

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => ClientPaymentStatusFilterCriteria)
  clientPaymentStatus?: ClientPaymentStatusFilterCriteria;

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => PurchasedDateFilterCriteria)
  purchasedDate?: PurchasedDateFilterCriteria | PurchasedDateFilterCriteria[];

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => RejectedDateFilterCriteria)
  rejectedDate?: RejectedDateFilterCriteria;

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => PaymentDateFilterCriteria)
  paymentDate?: PaymentDateFilterCriteria;

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => HasIssuesFilterCriteria)
  hasIssues?: HasIssuesFilterCriteria;

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => IsDirtyFilterCriteria)
  isDirty?: IsDirtyFilterCriteria;

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => ExpeditedFilterCriteria)
  expedited?: ExpeditedFilterCriteria;

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => VipFilterCriteria)
  vip?: VipFilterCriteria;

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => InactiveClientsFilterCriteria)
  inactiveClients?: InactiveClientsFilterCriteria;

  @Expose()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => OutstandingFilterCriteria)
  outstanding?: OutstandingFilterCriteria | OutstandingFilterCriteria[];

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => SuccessTeamFilterCriteria)
  successTeamId?: SuccessTeamFilterCriteria;

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => TransferFilterCriteria)
  transfer?: TransferFilterCriteria;

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => BrokerTagCriteria)
  brokerTag?: BrokerTagCriteria;

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => BuyoutFilterCriteria)
  buyout?: BuyoutFilterCriteria;

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => FlaggedFilterCriteria)
  flagged?: FlaggedFilterCriteria;

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => ClientIdFilterCriteria)
  clientId?: ClientIdFilterCriteria;

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => ClientStatusFilterCriteria)
  clientStatus?: ClientStatusFilterCriteria;

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => NonpaymentFilterCriteria)
  nonpayment?: NonpaymentFilterCriteria;

  @Expose()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ClientOperatingBalanceCriteria)
  clientOperatingBalance?:
    | ClientOperatingBalanceCriteria
    | ClientOperatingBalanceCriteria[];

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => LoadNumberCriteria)
  loadNumber?: LoadNumberCriteria;

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => DisplayIdCriteria)
  displayId?: DisplayIdCriteria;

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => InvoiceValueCriteria)
  value?: InvoiceValueCriteria;

  @Expose()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => InvoiceTagsCriteria)
  tags?: InvoiceTagsCriteria | InvoiceTagsCriteria[];

  @Expose()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => InvoiceTagGroupsCriteria)
  tagGroups?: InvoiceTagGroupsCriteria | InvoiceTagGroupsCriteria[];
}
