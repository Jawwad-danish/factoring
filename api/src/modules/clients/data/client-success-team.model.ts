import { BaseModel } from '@core/data';
import { Expose } from 'class-transformer';

export class ClientSuccessTeam extends BaseModel<ClientSuccessTeam> {
  @Expose()
  id: string;

  @Expose()
  name: string;
}
