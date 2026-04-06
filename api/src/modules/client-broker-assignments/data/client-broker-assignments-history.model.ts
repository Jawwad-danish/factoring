import { AuditBaseModel } from '@core/data';
import { Enum } from '@mikro-orm/core';
import { ClientBrokerAssignmentStatus } from '@module-persistence';
import { Expose, Type } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { AssignmentsChangelogHistory } from './assignments-changelog-history.model';

export class ClientBrokerAssignmentHistory extends AuditBaseModel<ClientBrokerAssignmentHistory> {
  @Expose()
  id: string;

  @Expose()
  @IsOptional()
  note: string | null;

  @Expose()
  @IsOptional()
  changelogNotes: string | null;

  @Enum({
    items: () => ClientBrokerAssignmentStatus,
    nullable: true,
  })
  @IsOptional()
  status: ClientBrokerAssignmentStatus | null;

  @IsArray()
  @ValidateNested()
  @Expose()
  @Type(() => AssignmentsChangelogHistory)
  assignmentsChangelogHistory: AssignmentsChangelogHistory[];
}
