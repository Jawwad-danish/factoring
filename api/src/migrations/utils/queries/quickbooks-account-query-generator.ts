import { environment } from '@core/environment';
import { UUID } from '@core/uuid';
import { Query } from '@mikro-orm/migrations';
import { QuickbooksAccountEntity } from '@module-persistence';
import { BaseQueryGenerator } from './base-query-generator';

export type QuickbooksAccountData = {
  key: string;
  name: string | null;
  number: string | null;
  type: string | null;
  subType: string | null;
  quickbooksId: string | null;
};

export class QuickbooksAccountQueryGenerator extends BaseQueryGenerator {
  addQuickbooksAccount(data: QuickbooksAccountData): Query {
    const entity = this.buildQuickbooksAccountEntity(data);
    return this.getQuery(
      this.driver
        .createQueryBuilder(QuickbooksAccountEntity.name)
        .insert(entity),
    );
  }

  deleteQuickbooksAccount(key: string) {
    return this.getQuery(
      this.driver
        .createQueryBuilder(QuickbooksAccountEntity.name)
        .delete()
        .where({ key }),
    );
  }

  private buildQuickbooksAccountEntity(data: QuickbooksAccountData): any {
    return {
      ...data,
      id: UUID.get(),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: environment.core.systemId(),
      updatedBy: environment.core.systemId(),
    };
  }
}
