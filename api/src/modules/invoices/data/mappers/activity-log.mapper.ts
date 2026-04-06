import { DataMapper } from '@core/mapping';
import { ActivityLog, TagDefinition } from '@fs-bobtail/factoring/data';
import { UserMapper } from '@module-common';
import { ActivityLogEntity, UsedByType } from '@module-persistence/entities';
import { TagDefinitionMapper } from '@module-tag-definitions';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ActivityLogMapper
  implements DataMapper<ActivityLogEntity, ActivityLog>
{
  constructor(
    private readonly tagDefinitionMapper: TagDefinitionMapper,
    private readonly userMapper: UserMapper,
  ) {}

  async entityToModel(entity: ActivityLogEntity): Promise<ActivityLog> {
    const activityLog = new ActivityLog({
      id: entity.id,
      tagDefinition: await this.tagDefinitionMapper.entityToModel(
        entity.tagDefinition,
      ),
      note: entity.note,
      groupId: entity.groupId,
      payload: entity.payload,
      createdAt: entity.createdAt,
      createdBy: await this.userMapper.createdByToModel(entity),
      recordStatus: entity.recordStatus,
      tagStatus: entity.tagStatus,
    });
    return activityLog;
  }

  addExtraFieldsModel(activities: ActivityLog[], tags: TagDefinition[]): void {
    for (const activity of activities) {
      activity.assignedBy =
        tags.find((tag) => tag.id === activity.tagDefinition.id)
          ?.assignedByType ?? UsedByType.System;
    }
  }
}
