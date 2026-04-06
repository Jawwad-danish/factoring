import { Options, MikroORM } from '@mikro-orm/postgresql';
import { Provider } from '@nestjs/common';
import { registry } from '@module-persistence/entities';

export const mockMikroORMProvider: Provider = {
  provide: MikroORM,
  useFactory: async () => {
    const options: Options = {
      allowGlobalContext: false,
      dbName: 'test',
      host: 'test',
      user: 'test',
      password: 'test',
      connect: false,
      entities: registry,
    };
    return MikroORM.init(options);
  },
};
