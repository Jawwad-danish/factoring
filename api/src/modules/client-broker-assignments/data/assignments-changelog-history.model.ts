import { AuditBaseModel } from '@core/data';
import { Expose } from 'class-transformer';
import { IsUUID } from 'class-validator';

export class AssignmentsChangelogHistory extends AuditBaseModel<AssignmentsChangelogHistory> {
  @IsUUID()
  @Expose()
  id: string;

  @IsUUID()
  @Expose()
  changelogNotes: string;

  @IsUUID()
  @Expose()
  description: string;
}
