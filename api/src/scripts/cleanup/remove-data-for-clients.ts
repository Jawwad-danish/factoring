import { batch } from '@core/util';
import { EntityManager, RequestContext } from '@mikro-orm/core';
import {
  AbstractSqlConnection,
  AbstractSqlDriver,
} from '@mikro-orm/postgresql';
import { AppModule } from '@module-app';
import { DatabaseService } from '@module-database';
import { INestApplicationContext, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { EmptyReport } from '../util/report';
import { run } from '../util/run';

const clientIds = [];

// Script will not work with HistorySubscriber
// Please remove it from the database service before running the script

export class CleanupScript {
  private logger = new Logger('data-cleanup');
  private app: INestApplicationContext;
  private databaseService: DatabaseService;

  private async init() {
    this.app = await NestFactory.createApplicationContext(AppModule);
    this.databaseService = this.app.get(DatabaseService);
  }

  async cleanupClients(clientIds: string[]) {
    if (!this.app) {
      await this.init();
    }
    await this.databaseService.withRequestContext(async () => {
      const em =
        RequestContext.getEntityManager() as EntityManager<AbstractSqlDriver>;

      const connection = em.getConnection();
      const batches = batch(clientIds, 10);
      for (const batch of batches) {
        try {
          await connection.execute('BEGIN;');
          await this.removeDataForClient(batch, connection);
          await connection.execute('COMMIT;');
          this.logger.log(`Successfully cleaned up data for clients ${batch}`);
        } catch (error) {
          await connection.execute('ROLLBACK;');
          this.logger.error(
            `Error cleaning up data for clients ${batch}: ${error.message}`,
          );
        }
      }
      await em.flush();
    });
  }

  private async removeDataForClient(
    clientIds: string[],
    connection: AbstractSqlConnection,
  ) {
    // Client Payments
    await this.deleteInvoiceClientPayments(clientIds, connection);
    await this.deleteReserveClientPayments(clientIds, connection);
    await this.deleteClientPayments(clientIds, connection);

    // Broker Payments
    await this.deleteBrokerPaymentReserves(clientIds, connection);
    await this.deleteBrokerPayments(clientIds, connection);

    // Invoices
    await this.deleteInvoiceDocuments(clientIds, connection);
    await this.deleteInvoiceActivity(clientIds, connection);
    await this.deleteInvoiceTags(clientIds, connection);
    await this.deleteInvoiceReserves(clientIds, connection);
    await this.deleteInvoices(clientIds, connection);

    // Reserves
    await this.deleteReserves(clientIds, connection);

    // Client-Broker Assignments
    await this.deleteAssignmentsChangelogAssoc(clientIds, connection);
    await this.deleteClientBrokerAssignmentsAssoc(clientIds, connection);
    await this.deleteClientBrokerAssignments(clientIds, connection);

    // Reserve AccountFunds
    await this.deleteReserveAccountFunds(clientIds, connection);

    // Client Data
    await this.deleteClientStatusReasonAssocs(clientIds, connection);
    await this.deleteClientRateReasonAssocs(clientIds, connection);
    await this.deleteClientLimits(clientIds, connection);
    await this.deleteUnderwritingNotes(clientIds, connection);
    await this.deleteClientPaymentPlanAssocs(clientIds, connection);
    await this.deleteClientReserveRateReasonsAssoc(clientIds, connection);
    await this.deleteClientFactoringConfigs(clientIds, connection);
  }

  private async executeQuery(
    query: string,
    clientIds: string[],
    connection: AbstractSqlConnection,
    entity: string,
  ) {
    await connection.execute(query);
    this.logger.log(`Deleted all ${entity} for clients ${clientIds}`);
  }

  private async deleteInvoiceClientPayments(
    clientIds: string[],
    connection: AbstractSqlConnection,
  ) {
    const query = `
    DELETE FROM invoice_client_payments WHERE client_payment_id IN (
      SELECT id FROM client_payments WHERE client_id ${this.buildInClause(
        clientIds,
      )}
    )`;
    await this.executeQuery(
      query,
      clientIds,
      connection,
      'invoice client payments',
    );
  }

  private async deleteReserveClientPayments(
    clientIds: string[],
    connection: AbstractSqlConnection,
  ) {
    const query = `
    DELETE FROM reserves_client_payment WHERE client_payment_id IN (
      SELECT id FROM client_payments WHERE client_id ${this.buildInClause(
        clientIds,
      )}
    );`;
    await this.executeQuery(
      query,
      clientIds,
      connection,
      'reserve client payments',
    );
  }

  private async deleteClientPayments(
    clientIds: string[],
    connection: AbstractSqlConnection,
  ) {
    const query = `
    DELETE FROM client_payments WHERE client_id ${this.buildInClause(
      clientIds,
    )};`;
    await this.executeQuery(query, clientIds, connection, 'client payments');
  }

  private async deleteBrokerPayments(
    clientIds: string[],
    connection: AbstractSqlConnection,
  ) {
    const query = `
    DELETE FROM broker_payments WHERE invoice_id IN (
      SELECT id FROM invoices WHERE client_id ${this.buildInClause(clientIds)}
    );`;
    await this.executeQuery(query, clientIds, connection, 'broker payments');
  }

  private async deleteInvoices(
    clientIds: string[],
    connection: AbstractSqlConnection,
  ) {
    const query = `
    DELETE FROM invoices WHERE client_id ${this.buildInClause(clientIds)}`;
    await this.executeQuery(query, clientIds, connection, 'invoices');
  }

  private async deleteInvoiceDocuments(
    clientIds: string[],
    connection: AbstractSqlConnection,
  ) {
    const query = `
    DELETE FROM documents WHERE invoice_id IN (
      SELECT id FROM invoices WHERE client_id ${this.buildInClause(clientIds)}
    );`;
    await this.executeQuery(query, clientIds, connection, 'invoice documents');
  }

  private async deleteInvoiceActivity(
    clientIds: string[],
    connection: AbstractSqlConnection,
  ) {
    const query = `
    DELETE FROM invoice_activity_log WHERE invoice_id IN (
      SELECT id FROM invoices WHERE client_id in('${clientIds.join("','")}')
    );`;
    await this.executeQuery(query, clientIds, connection, 'invoice activities');
  }

  private async deleteInvoiceTags(
    clientIds: string[],
    connection: AbstractSqlConnection,
  ) {
    const query = `
    DELETE FROM invoice_tag_assoc WHERE invoice_id IN (
      SELECT id FROM invoices WHERE client_id in('${clientIds.join("','")}')
    );`;
    await this.executeQuery(query, clientIds, connection, 'invoice tags');
  }

  private async deleteReserves(
    clientIds: string[],
    connection: AbstractSqlConnection,
  ) {
    const query = `DELETE FROM reserves WHERE client_id ${this.buildInClause(
      clientIds,
    )};`;
    await this.executeQuery(query, clientIds, connection, 'reserves');
  }

  private async deleteInvoiceReserves(
    clientIds: string[],
    connection: AbstractSqlConnection,
  ) {
    const query = `
    DELETE FROM reserves_invoice WHERE reserve_id IN (
      SELECT id FROM reserves WHERE client_id ${this.buildInClause(clientIds)}
    );`;
    await this.executeQuery(query, clientIds, connection, 'invoice reserves');
  }

  private async deleteBrokerPaymentReserves(
    clientIds: string[],
    connection: AbstractSqlConnection,
  ) {
    const query = `
    DELETE FROM reserves_broker_payment WHERE reserve_id IN (
      SELECT id FROM reserves WHERE client_id ${this.buildInClause(clientIds)}
    );`;
    await this.executeQuery(
      query,
      clientIds,
      connection,
      'broker payment reserves',
    );
  }

  private async deleteClientBrokerAssignments(
    clientIds: string[],
    connection: AbstractSqlConnection,
  ) {
    const query = `
    DELETE FROM client_broker_assignments WHERE client_id ${this.buildInClause(
      clientIds,
    )};`;
    await this.executeQuery(
      query,
      clientIds,
      connection,
      'client broker assignments',
    );
  }

  private async deleteReserveAccountFunds(
    clientIds: string[],
    connection: AbstractSqlConnection,
  ) {
    const query = `
    DELETE FROM reserve_account_funds WHERE client_id ${this.buildInClause(
      clientIds,
    )};`;
    await this.executeQuery(
      query,
      clientIds,
      connection,
      'reserve account funds',
    );
  }

  private async deleteClientStatusReasonAssocs(
    clientIds: string[],
    connection: AbstractSqlConnection,
  ) {
    const query = `
    DELETE FROM client_status_reasons_assoc WHERE config_id IN (
      SELECT id FROM client_factoring_configs WHERE client_id ${this.buildInClause(
        clientIds,
      )}
    );`;
    await this.executeQuery(
      query,
      clientIds,
      connection,
      'status reason associations',
    );
  }

  private async deleteClientRateReasonAssocs(
    clientIds: string[],
    connection: AbstractSqlConnection,
  ) {
    const query = `
    DELETE FROM client_factoring_rate_reasons_assoc WHERE config_id IN (
      SELECT id FROM client_factoring_configs WHERE client_id ${this.buildInClause(
        clientIds,
      )}
    );`;
    await this.executeQuery(
      query,
      clientIds,
      connection,
      'rate reason associations',
    );
  }

  private async deleteClientLimits(
    clientIds: string[],
    connection: AbstractSqlConnection,
  ) {
    const query = `
    DELETE FROM client_limit_assoc WHERE config_id IN (
      SELECT id from client_factoring_configs WHERE client_id ${this.buildInClause(
        clientIds,
      )}
    );`;
    await this.executeQuery(query, clientIds, connection, 'client limits');
  }

  private async deleteClientReserveRateReasonsAssoc(
    clientIds: string[],
    connection: AbstractSqlConnection,
  ) {
    const query = `
    DELETE FROM client_reserve_rate_reasons_assoc WHERE config_id IN(
      SELECT id FROM client_factoring_configs WHERE client_id ${this.buildInClause(
        clientIds,
      )}
    );`;
    await this.executeQuery(
      query,
      clientIds,
      connection,
      'client reserve rate reason assoc',
    );
  }

  private async deleteUnderwritingNotes(
    clientIds: string[],
    connection: AbstractSqlConnection,
  ) {
    const query = `
    DELETE FROM client_factoring_underwriting_notes WHERE config_id IN (
      SELECT id FROM client_factoring_configs WHERE client_id ${this.buildInClause(
        clientIds,
      )}
    );`;
    await this.executeQuery(
      query,
      clientIds,
      connection,
      'client factoring underwriting notes',
    );
  }

  private async deleteClientPaymentPlanAssocs(
    clientIds: string[],
    connection: AbstractSqlConnection,
  ) {
    const query = `
    DELETE FROM client_payment_plan_assoc WHERE config_id IN (
      SELECT id FROM client_factoring_configs WHERE client_id ${this.buildInClause(
        clientIds,
      )}
    );`;
    await this.executeQuery(
      query,
      clientIds,
      connection,
      'client payment plan associations',
    );
  }

  private async deleteClientFactoringConfigs(
    clientIds: string[],
    connection: AbstractSqlConnection,
  ) {
    const query = `DELETE FROM client_factoring_configs WHERE client_id ${this.buildInClause(
      clientIds,
    )};`;
    await this.executeQuery(
      query,
      clientIds,
      connection,
      'client factoring configs',
    );
  }

  private async deleteClientBrokerAssignmentsAssoc(
    clientIds: string[],
    connection: AbstractSqlConnection,
  ) {
    const query = `
    DELETE FROM client_broker_assignment_assoc WHERE client_broker_assignment_id IN (
      SELECT id FROM client_broker_assignments WHERE client_id ${this.buildInClause(
        clientIds,
      )}
    );`;
    await this.executeQuery(
      query,
      clientIds,
      connection,
      'client broker assignments associations',
    );
  }

  private async deleteAssignmentsChangelogAssoc(
    clientIds: string[],
    connection: AbstractSqlConnection,
  ) {
    const query = `DELETE FROM assignments_changelog_assoc WHERE assignment_assoc_history_id IN (
      SELECT cba_assoc.id
      FROM client_broker_assignment_assoc cba_assoc
      INNER JOIN client_broker_assignments cba ON cba.id = cba_assoc.client_broker_assignment_id
      WHERE cba.client_id ${this.buildInClause(clientIds)}
    );`;

    await this.executeQuery(
      query,
      clientIds,
      connection,
      'assignments changelog associations',
    );
  }

  private buildInClause(clientIds: string[]) {
    return `in('${clientIds.join("','")}')`;
  }
}

const handle = async () => {
  const script = new CleanupScript();
  await script.cleanupClients(clientIds);
};

run(handle, new EmptyReport(), __dirname, {
  logError: true,
});
