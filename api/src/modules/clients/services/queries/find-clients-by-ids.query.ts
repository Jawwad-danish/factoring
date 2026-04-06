import { Query } from '@module-cqrs';
import { Client } from '../../data';
import { FindClientsOptions } from './find-clients-options';

export class FindClientsByIds extends Query<Client[]> {
  constructor(readonly ids: string[], readonly options?: FindClientsOptions) {
    super();
  }
}
