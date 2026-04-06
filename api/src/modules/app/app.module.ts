import { SentryExceptionInterceptor } from '@core/services';
import { RequestLoggingMiddleware, RequestStorageInterceptor } from '@core/web';
import { AnalyticsModule } from '@module-analytics';
import { AuditLogModule } from '@module-audit-log';
import { BrokerPaymentsModule } from '@module-broker-payments';
import { BuyoutsModule } from '@module-buyouts';
import { ClientPaymentsModule } from '@module-client-payments';
import { ClientsModule } from '@module-clients';
import { CommonModule } from '@module-common';
import { DatabaseModule } from '@module-database';
import { DocumentGenerationModule } from '@module-document-generation';
import { InvoicesModule } from '@module-invoices';
import { NotificationsModule } from '@module-notifications';
import { PersistenceModule } from '@module-persistence';
import { PeruseModule } from '@module-peruse';
import { ReportsModule } from '@module-reports';
import { ReserveAccountFundsModule } from '@module-reserve-account-funds';
import { SlackExceptionInterceptor, SlackModule } from '@module-slack';
import { TagDefinitionsModule } from '@module-tag-definitions';
import { TransfersModule } from '@module-transfers';
import { UsersModule } from '@module-users';
import { V1SyncModule } from '@module-v1-sync';
import { WorkerApiModule } from '@module-worker';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthModule } from '../auth';
import { ClientBrokerAssignmentsModule } from '../client-broker-assignments';
import { DashboardModule } from '../dashboard/dashboard.module';
import { HealthModule } from '../health/health.modules';
import { MaintenanceModule } from '../maintenance/maintenance.module';
import { ProcessingNotesModule } from '../processing-notes';
import { FirebaseModule } from '../firebase';
import { AppController } from './app.controller';
import { QuickbooksModule } from '@module-quickbooks';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [],
})
export class InstrumentationModule {}

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    AuditLogModule,
    AuthModule,
    FirebaseModule,
    BrokerPaymentsModule,
    BuyoutsModule,
    ClientBrokerAssignmentsModule,
    ClientPaymentsModule,
    ClientsModule,
    CommonModule,
    DashboardModule,
    DatabaseModule,
    PersistenceModule,
    DocumentGenerationModule,
    WorkerApiModule,
    HealthModule,
    MaintenanceModule,
    InvoicesModule,
    UsersModule,
    TransfersModule,
    TagDefinitionsModule,
    ReserveAccountFundsModule,
    ProcessingNotesModule,
    V1SyncModule,
    SlackModule,
    AnalyticsModule,
    PeruseModule,
    NotificationsModule,
    ReportsModule,
    QuickbooksModule,
    InstrumentationModule,
  ],
  controllers: [],
  providers: [
    SentryExceptionInterceptor,
    RequestStorageInterceptor,
    SlackExceptionInterceptor,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggingMiddleware).exclude('health').forRoutes('*');
  }
}
