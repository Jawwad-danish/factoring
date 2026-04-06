import { environment } from '@core/environment';
import { DatabaseService } from '@module-database';
import {
  AssignmentsChangelogAssocEntity,
  ClientBrokerAssignmentAssocEntity,
  ClientBrokerAssignmentEntity,
  ClientBrokerAssignmentStatus,
  UserEntity,
} from '@module-persistence/entities';
import { ClientBrokerAssignmentRepository } from '@module-persistence/repositories';
import { INestApplicationContext } from '@nestjs/common';
import * as path from 'path';
import {
  ImportReport,
  OnConflictStrategy,
  getSystemID,
  importEntities,
  referenceUserData,
} from '../../util';
import { EntityManager } from '@mikro-orm/core';

const PATH = environment.util.checkAndGetForEnvVariable(
  'SCRIPT_IMPORT_CLIENT_BROKER_ASSIGNMENTS_PATH',
);

const assignmentStatusMapping: { [key: string]: ClientBrokerAssignmentStatus } =
  {
    pending: ClientBrokerAssignmentStatus.Sent,
    verified: ClientBrokerAssignmentStatus.Verified,
    released: ClientBrokerAssignmentStatus.Released,
  };

export const importClientBrokerAssignments = async (
  clientId: null | string,
  report: ImportReport,
  app: INestApplicationContext,
) => {
  const databaseService = app.get(DatabaseService);
  const clientBrokerAssignmentRepository = app.get(
    ClientBrokerAssignmentRepository,
  );

  await importEntities({
    path: path.resolve(PATH, clientId ?? ''),
    report: report.ofDomain('client-broker-assignments'),
    mapperFn: (item, em) => {
      const entity = buildClientBrokerAssignment(item);
      buildClientBrokerAssignmentAssocByHistory(entity, item, em);
      buildClientBrokerAssignmentAssocByEmail(entity, item, em);
      referenceUserData(entity, item, em);
      return entity;
    },
    dependencies: {
      databaseService,
      repository: clientBrokerAssignmentRepository,
    },
    saveOptions: {
      onConflict: {
        strategy: OnConflictStrategy.MERGE,
        fields: ['id'],
      },
    },
  });
};

function buildClientBrokerAssignment(data: any): ClientBrokerAssignmentEntity {
  const entity = new ClientBrokerAssignmentEntity();
  entity.id = data.id;
  entity.clientId = data.client_id;
  entity.brokerId = data.debtor_id;
  entity.status = assignmentStatusMapping[data.status];
  return entity;
}

function mapAssignmentEmailNote(emailItem: any): string {
  if (!emailItem?.email_type || !emailItem?.email) {
    return '';
  }

  if (emailItem?.email_type === 'noa') {
    return `NOA was emailed to ${emailItem.email}`;
  } else if (emailItem?.email_type === 're-send noa') {
    return `NOA was resent to ${emailItem.email}`;
  }
  return '';
}

function buildClientBrokerAssignmentAssocByHistory(
  entity: ClientBrokerAssignmentEntity,
  data: any,
  em: EntityManager,
) {
  const items = data?.assignments_history?.map((historyItem: any) => {
    const assocEntity = new ClientBrokerAssignmentAssocEntity();
    assocEntity.status = assignmentStatusMapping[historyItem.status];
    assocEntity.note = '';
    assocEntity.createdAt = new Date(historyItem.created_at);
    assocEntity.updatedAt = new Date(historyItem.updated_at);
    assocEntity.createdBy = historyItem.updated_by
      ? em.getReference(UserEntity, historyItem.updated_by)
      : em.getReference(UserEntity, getSystemID());
    assocEntity.updatedBy = assocEntity.createdBy;
    assocEntity.clientBrokerAssignment = entity;
    return assocEntity;
  });
  entity.assignmentHistory.add(items);
  return entity;
}

function buildClientBrokerAssignmentAssocByEmail(
  entity: ClientBrokerAssignmentEntity,
  data: any,
  em: EntityManager,
) {
  const items = data?.emails?.map((emailItem: any) => {
    const assocEntity = new ClientBrokerAssignmentAssocEntity();
    assocEntity.status = null;
    assocEntity.note = mapAssignmentEmailNote(emailItem);
    assocEntity.changelogNotes = emailItem.changelog_notes;
    assocEntity.createdAt = new Date(emailItem.created_at);
    assocEntity.updatedAt = new Date(emailItem.updated_at);
    assocEntity.createdBy = emailItem.updated_by
      ? em.getReference(UserEntity, emailItem.updated_by)
      : em.getReference(UserEntity, getSystemID());
    assocEntity.updatedBy = assocEntity.createdBy;
    assocEntity.clientBrokerAssignment = entity;
    const emailHistory = emailItem?.emails_history?.map(
      (emailHistoryItem: any) => {
        const changelogEntity = new AssignmentsChangelogAssocEntity();
        changelogEntity.changelogNotes = emailHistoryItem.changelog_notes;
        changelogEntity.description = emailHistoryItem.description;
        changelogEntity.createdAt = new Date(emailHistoryItem.created_at);
        changelogEntity.updatedAt = new Date(emailHistoryItem.updated_at);
        changelogEntity.createdBy = emailHistoryItem.updated_by
          ? em.getReference(UserEntity, emailHistoryItem.updated_by)
          : em.getReference(UserEntity, getSystemID());
        changelogEntity.updatedBy = changelogEntity.createdBy;
        changelogEntity.assignmentAssocHistory = assocEntity;
        return changelogEntity;
      },
    );
    assocEntity.changelogHistory.add(emailHistory);
    return assocEntity;
  });
  entity.assignmentHistory.add(items);
  return entity;
}

// run(
//   () => importClientBrokerAssignments('8f4895dc-6bef-47e6-b1d9-b7d134952e49'),
//   RESULT,
//   __dirname,
// );
