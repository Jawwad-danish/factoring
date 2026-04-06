import { DataMapper } from '@core/mapping';
import { AuditLog } from '@fs-bobtail/factoring/data';
import { AuditLogEntity } from '@module-persistence/entities';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AuditLogMapper implements DataMapper<AuditLogEntity, AuditLog> {
  async entityToModel(entity: AuditLogEntity): Promise<AuditLog> {
    return new AuditLog({
      id: entity.id,
      type: entity.type,
      notes: entity.notes,
      payload: entity.payload,
      createdAt: entity.createdAt,
    });
  }
}
