import { environment } from '@core/environment';
import { UUID } from '@core/uuid';
import { Query } from '@mikro-orm/migrations';
import { ClientSuccessTeamEntity } from '@module-persistence/entities';
import { BaseQueryGenerator } from './base-query-generator';

export type ClientSuccessTeamData = {
  name: string;
};

export class ClientSuccessTeamQueryGenerator extends BaseQueryGenerator {
  insert(data: ClientSuccessTeamData): Query {
    const entity = this.buildClientSuccessTeam(data);
    return this.getQuery(
      this.driver
        .createQueryBuilder(ClientSuccessTeamEntity.name)
        .insert(entity),
    );
  }

  getTeamIdQuery(teamName: string): Query {
    return this.getQuery(
      this.driver
        .createQueryBuilder(ClientSuccessTeamEntity.name)
        .select('id')
        .where({ name: teamName })
        .limit(1),
    );
  }

  private buildClientSuccessTeam(data: ClientSuccessTeamData): any {
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
