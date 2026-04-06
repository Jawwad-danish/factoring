import { BaseModel, FilterOperator } from '@core/data';
import { Exclude, Expose, Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export enum ClientBrokerAssignmentStatusFilter {
  IN_PROGRESS = 'in-progress',
  VERIFIED = 'verified',
  RELEASED = 'released',
}

export class BrokerIdFilterCriteria extends BaseModel<BrokerIdFilterCriteria> {
  @Expose()
  @IsUUID()
  value: string;

  @Expose()
  @IsEnum(FilterOperator)
  @IsIn([FilterOperator.EQ])
  operator: FilterOperator;
}

export class ClientIdFilterCriteria extends BaseModel<ClientIdFilterCriteria> {
  @Expose()
  @IsUUID()
  value: string;

  @Expose()
  @IsEnum(FilterOperator)
  @IsIn([FilterOperator.EQ])
  operator: FilterOperator;
}

export class StatusFilterCriteria extends BaseModel<StatusFilterCriteria> {
  @Expose()
  @IsEnum(ClientBrokerAssignmentStatusFilter)
  value: ClientBrokerAssignmentStatusFilter;

  @Expose()
  @IsEnum(FilterOperator)
  @IsIn([FilterOperator.EQ])
  operator: FilterOperator;
}

export class BrokerLegalNameFilterCriteria extends BaseModel<BrokerLegalNameFilterCriteria> {
  @Expose()
  @IsString()
  value: string;

  @Expose()
  @IsEnum(FilterOperator)
  @IsIn([FilterOperator.EQ, FilterOperator.ILIKE])
  operator: FilterOperator;
}

@Exclude()
export class FindClientBrokerAssignmentsFilterCriteria extends BaseModel<FindClientBrokerAssignmentsFilterCriteria> {
  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => BrokerIdFilterCriteria)
  brokerId?: BrokerIdFilterCriteria;

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => ClientIdFilterCriteria)
  clientId?: ClientIdFilterCriteria;

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => StatusFilterCriteria)
  status?: StatusFilterCriteria;

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => BrokerLegalNameFilterCriteria)
  legalName?: BrokerLegalNameFilterCriteria;
}
