create table "auth0_log_entries" (
    "id" uuid not null default uuid_generate_v4(),
    "email" varchar(255) not null,
    "entries" jsonb not null,
    "created_at" timestamptz(3) not null,
    constraint "auth0_log_entries_pkey" primary key ("id")
);