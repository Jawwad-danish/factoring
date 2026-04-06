import { AuditBaseModel } from '@core/data';
import { Broker } from '@module-brokers/data';
import { Client } from '@module-clients/data';
import { ProcessingNotesStatus } from '@module-persistence/entities';
import { Expose } from 'class-transformer';

export class ProcessingNotes extends AuditBaseModel<ProcessingNotes> {
  @Expose()
  id: string;

  @Expose()
  clientId?: string;

  @Expose()
  brokerId?: string;

  @Expose()
  status: ProcessingNotesStatus;

  @Expose()
  client?: Client;

  @Expose()
  broker?: Broker;

  @Expose()
  notes: string;
}
