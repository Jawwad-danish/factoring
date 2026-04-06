import { Migration } from '@mikro-orm/migrations';

export class Migration20231026143404 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'alter table "users" add column "email" varchar(255) not null, add column "first_name" varchar(255) null, add column "last_name" varchar(255) null;',
    );
    this.addSql(
      'alter table "users" rename column "auth0id" to "external_id";',
    );
    this.addSql(
      'alter table "users" alter column "external_id" type varchar(255), alter column "external_id" set not null;',
    );
    this.addSql(
      'comment on column "users"."external_id" is \'External ID of the authentication service like Cognito or Auth0\';',
    );
    this.addSql(
      'alter table "users" add constraint "users_external_id_unique" unique ("external_id");',
    );
    this.addSql(
      'alter table "users" add constraint "users_email_unique" unique ("email");',
    );
  }

  async down(): Promise<void> {
    this.addSql(
      'alter table "users" drop constraint "users_external_id_unique";',
    );
    this.addSql('alter table "users" drop constraint "users_email_unique";');
    this.addSql('alter table "users" drop column "email";');
    this.addSql('alter table "users" drop column "first_name";');
    this.addSql('alter table "users" drop column "last_name";');
    this.addSql(
      'alter table "users" rename column "external_id" to "auth0id";',
    );
  }
}
