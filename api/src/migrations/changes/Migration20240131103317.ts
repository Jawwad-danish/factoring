import { Migration } from '@mikro-orm/migrations';
import {
  UserData,
  UsersQueryGenerator,
} from '../utils/queries/users-query-generator';
import { environment } from '@core/environment';

export class Migration20240131103317 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'alter table "users" alter column "created_by_id" drop default;',
    );
    this.addSql(
      'alter table "users" alter column "created_by_id" type uuid using ("created_by_id"::text::uuid);',
    );
    this.addSql(
      'alter table "users" alter column "created_by_id" drop not null;',
    );
    this.addSql(
      'alter table "users" alter column "updated_by_id" drop default;',
    );
    this.addSql(
      'alter table "users" alter column "updated_by_id" type uuid using ("updated_by_id"::text::uuid);',
    );
    this.addSql(
      'alter table "users" alter column "updated_by_id" drop not null;',
    );
    this.addSql(
      'alter table "users" alter column "external_id" type varchar(255) using ("external_id"::varchar(255));',
    );
    this.addSql(
      'alter table "users" alter column "external_id" drop not null;',
    );
    this.addSql(
      'alter table "users" add constraint "users_created_by_id_foreign" foreign key ("created_by_id") references "users" ("id") on update cascade on delete set null;',
    );
    this.addSql(
      'alter table "users" add constraint "users_updated_by_id_foreign" foreign key ("updated_by_id") references "users" ("id") on update cascade on delete set null;',
    );

    const queryGenerator = new UsersQueryGenerator(this.driver);
    this.addSql(queryGenerator.addUser(systemUser));
  }

  async down(): Promise<void> {
    const queryGenerator = new UsersQueryGenerator(this.driver);
    this.addSql(queryGenerator.deleteUser(systemUser.id));

    this.addSql(
      'alter table "users" drop constraint "users_created_by_id_foreign";',
    );
    this.addSql(
      'alter table "users" drop constraint "users_updated_by_id_foreign";',
    );

    this.addSql(
      'alter table "users" alter column "external_id" type varchar using ("external_id"::varchar);',
    );
    this.addSql('alter table "users" alter column "external_id" set not null;');
    this.addSql(
      'alter table "users" alter column "created_by_id" drop default;',
    );
    this.addSql(
      'alter table "users" alter column "created_by_id" type uuid using ("created_by_id"::text::uuid);',
    );
    this.addSql(
      'alter table "users" alter column "created_by_id" set not null;',
    );
    this.addSql(
      'alter table "users" alter column "updated_by_id" drop default;',
    );
    this.addSql(
      'alter table "users" alter column "updated_by_id" type uuid using ("updated_by_id"::text::uuid);',
    );
    this.addSql(
      'alter table "users" alter column "updated_by_id" set not null;',
    );
  }
}

const systemUser: UserData = {
  id: environment.core.systemId(),
  externalId: null,
  firstName: 'system',
  lastName: 'system',
  email: 'system@bobtail.com',
  created_by_id: null,
  updated_by_id: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};
