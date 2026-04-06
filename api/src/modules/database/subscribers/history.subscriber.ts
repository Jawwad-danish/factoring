import { AppContextHolder } from '@core/app-context';
import {
  ChangeSet,
  ChangeSetType,
  EntityData,
  EntityManager,
  EventSubscriber,
  FlushEventArgs,
  FromEntityType,
  UnitOfWork,
} from '@mikro-orm/core';
import {
  BasicEntity,
  BasicMutableEntity,
  PrimitiveEntity,
  RecordStatus,
  RequestStorageEntity,
} from '@module-persistence/entities';
import { HistoryFactory, OperationType } from '@module-persistence/history';
import { UUID } from '@core/uuid';

export class HistorySubscriber implements EventSubscriber {
  async onFlush({ em, uow }: FlushEventArgs): Promise<void> {
    const changeSets = uow.getChangeSets();
    const auditBy = this.getAuditBy();
    for (const change of changeSets) {
      const { type, entity, name } = change;
      if (type === ChangeSetType.CREATE) {
        this.assignCreateAuditFields(entity, em, auditBy);
      } else if (type === ChangeSetType.UPDATE) {
        this.assignUpdateAuditFields(entity, em, auditBy);
      }
      if (!HistoryFactory.isHistoryEntity(name)) {
        this.assignHistory(change, em, uow, auditBy);
      }
      uow.recomputeSingleChangeSet(entity);
    }
  }

  private assignCreateAuditFields(
    entity: any,
    em: EntityManager,
    auditBy: string,
  ) {
    if (entity.constructor.name === RequestStorageEntity.name) {
      return;
    }

    if (entity instanceof BasicMutableEntity) {
      this.assign(em, entity, {
        id: entity.id ?? UUID.get(),
        createdBy: entity.createdBy?.id ?? auditBy,
        updatedBy: entity.updatedBy?.id ?? auditBy,
      });
    } else if (entity instanceof BasicEntity) {
      this.assign(em, entity, {
        id: entity.id ?? UUID.get(),
        createdBy: entity.createdBy?.id ?? auditBy,
      });
    } else if (entity instanceof PrimitiveEntity) {
      this.assign(em, entity, {
        id: entity.id ?? UUID.get(),
        createdBy: entity.createdBy?.id ?? auditBy,
        updatedBy: entity.updatedBy?.id ?? auditBy,
      });
    }
  }

  private assignUpdateAuditFields(
    entity: any,
    em: EntityManager,
    auditBy: string,
  ) {
    if (entity instanceof BasicMutableEntity) {
      this.assign(em, entity, {
        updatedBy: entity.updatedBy?.id ?? auditBy,
      });
    }
  }

  private getAuditBy(): string {
    let appContext = AppContextHolder.get();
    if (!appContext.isAuthenticated()) {
      appContext = AppContextHolder.global();
    }
    return appContext.getAuthentication().principal.id;
  }

  private assign<E extends object>(
    em: EntityManager,
    entity: E,
    data: EntityData<FromEntityType<E>>,
  ) {
    return em.assign(entity, data, { merge: true });
  }

  private assignHistory(
    change: ChangeSet<Partial<any>>,
    em: EntityManager,
    uow: UnitOfWork,
    auditBy: string,
  ) {
    const { type, entity, originalEntity } = change;
    const basicEntity = entity as BasicEntity;
    const history = HistoryFactory.fromEntity(basicEntity);
    if (history != null) {
      this.assign(em, history, {
        createdById: auditBy,
      });
      if (type === ChangeSetType.CREATE) {
        history.operationType = OperationType.Create;
      } else if (type === ChangeSetType.UPDATE) {
        history.operationType = OperationType.Update;
        if (
          basicEntity.recordStatus === RecordStatus.Inactive &&
          originalEntity?.recordStatus === RecordStatus.Active
        ) {
          history.operationType = OperationType.Delete;
        }
      }
      uow.computeChangeSet(history);
    }
  }
}
