import { AuditBaseModel } from '@core/data';
import { Enum } from '@mikro-orm/core';
import { ClientBrokerAssignmentStatus } from '@module-persistence';
import { Expose, Type } from 'class-transformer';
import { IsArray, IsUUID, ValidateNested } from 'class-validator';
import { ClientBrokerAssignmentHistory } from './client-broker-assignments-history.model';
import { Client } from '@module-clients/data';
import { Broker } from '@module-brokers/data';

export class ClientBrokerAssignment extends AuditBaseModel<ClientBrokerAssignment> {
  @IsUUID()
  @Expose()
  id: string;

  @IsUUID()
  @Expose()
  clientId: string;

  @IsUUID()
  @Expose()
  brokerId: string;

  @Enum({
    items: () => ClientBrokerAssignmentStatus,
    nullable: false,
  })
  status: ClientBrokerAssignmentStatus;

  @Expose()
  client?: Client;

  @Expose()
  broker?: Broker;

  @IsArray()
  @ValidateNested()
  @Expose()
  @Type(() => ClientBrokerAssignmentHistory)
  assignmentsHistory: ClientBrokerAssignmentHistory[];
}
