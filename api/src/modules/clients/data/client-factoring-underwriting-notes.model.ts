import { AuditBaseModel } from '@core/data';
import { ClientFactoringUnderwritingSubject } from '@module-persistence';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class ClientFactoringUnderwritingNotes extends AuditBaseModel<ClientFactoringUnderwritingNotes> {
  @Expose()
  id: string;

  @Expose()
  @ApiProperty({
    title: 'Underwriting notes',
    description: 'Client factoring underwriting notes',
  })
  notes: string;

  @Expose()
  @ApiProperty({
    title: 'Underwriting subject',
    description: 'Client factoring underwriting subject',
  })
  subject: ClientFactoringUnderwritingSubject;
}
