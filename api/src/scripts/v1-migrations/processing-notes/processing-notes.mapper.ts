import {
  ProcessingNotesEntity,
  ProcessingNotesStatus,
  RecordStatus,
} from '@module-persistence/entities';

export const buildEntity = (data: any): ProcessingNotesEntity => {
  const entity = new ProcessingNotesEntity();
  entity.id = data.id;
  entity.clientId = data.client_id;
  entity.brokerId = data.debtor_id;
  entity.createdAt = data.created_at;
  entity.updatedAt = data.updated_at;
  entity.recordStatus = RecordStatus.Active;
  entity.status = mapStatus(data.status);
  entity.notes = data.notes;
  return entity;
};

const mapStatus = (status: string): ProcessingNotesStatus => {
  return status === 'active'
    ? ProcessingNotesStatus.Active
    : ProcessingNotesStatus.Archived;
};
