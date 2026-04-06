import { DataMapper } from '@core/mapping';
import { ClientSuccessTeamEntity } from '@module-persistence';
import { ClientSuccessTeam } from '../client-success-team.model';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ClientSuccessTeamMapper
  implements DataMapper<ClientSuccessTeamEntity, ClientSuccessTeam>
{
  async entityToModel(
    entity: ClientSuccessTeamEntity,
  ): Promise<ClientSuccessTeam> {
    const model = new ClientSuccessTeam();
    model.id = entity.id;
    model.name = entity.name;
    return model;
  }
}
