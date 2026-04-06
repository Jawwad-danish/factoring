import { BrokersModule } from '@module-brokers';
import { ClientsModule } from '@module-clients';
import { DatabaseModule } from '@module-database';
import { InvoicesModule } from '@module-invoices';
import { TagDefinitionsModule } from '@module-tag-definitions';
import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CommonModule } from '../common';
import { PersistenceModule } from '../persistence';
import { AppSeeder } from './app';
import { PendingBuyoutBatchSeeder } from './buyouts';
import { ClientBrokerAssignmentSeeder } from './client-broker-assignment';
import {
  ClientFactoringConfigsSeeder,
  ClientSeeder,
} from './client-factoring-config';
import { ClientSuccessTeamsSeeder } from './client-success-teams';
import { EmployeeSeeder } from './employees';
import { FactoringCompanySeeder } from './factoring-company';
import { InvoiceSeeder } from './invoices/invoice.seeder';
import { UserSeeder } from './users';

@Module({
  providers: [
    InvoiceSeeder,
    AppSeeder,
    ClientFactoringConfigsSeeder,
    ClientSuccessTeamsSeeder,
    ClientBrokerAssignmentSeeder,
    ClientFactoringConfigsSeeder,
    PendingBuyoutBatchSeeder,
    FactoringCompanySeeder,
    UserSeeder,
    ClientSeeder,
    EmployeeSeeder,
  ],
  exports: [
    AppSeeder,
    ClientFactoringConfigsSeeder,
    ClientSuccessTeamsSeeder,
    ClientBrokerAssignmentSeeder,
    PendingBuyoutBatchSeeder,
    UserSeeder,
    EmployeeSeeder,
  ],
  imports: [
    EventEmitterModule.forRoot(),
    TagDefinitionsModule,
    ClientsModule,
    BrokersModule,
    InvoicesModule,
    PersistenceModule,
    DatabaseModule,
    CommonModule,
  ],
})
export class SeedersModules {}
