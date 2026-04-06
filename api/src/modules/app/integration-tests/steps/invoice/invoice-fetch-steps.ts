import { QueryCriteria, serializeQueryCriteria } from '@core/data';
import { testingRequest } from '@core/test';
import { Invoice } from '@fs-bobtail/factoring/data';
import { UpdateBrokerFactoringStatsCommand } from '@module-brokers/commands';
import { CommandRunner } from '@module-cqrs';
import { DatabaseService, Transactional } from '@module-database';
import { InvoiceRisk } from '@module-invoices';
import { plainToInstance } from 'class-transformer';
import { StepsInput } from '../step';

export class InvoiceFetchSteps {
  constructor(private readonly input: StepsInput) {}

  async getAll(query?: Partial<QueryCriteria>): Promise<Invoice[]> {
    const response = await testingRequest(this.input.app.getHttpServer())
      .get(`/invoices`)
      .query(serializeQueryCriteria(query))
      .set('Content-type', 'application/json')
      .expect(200);
    const invoices = plainToInstance(Invoice, response.body.items as any[]);
    expect(invoices.length).toBeDefined();
    return invoices;
  }

  async getOne(invoiceId: string): Promise<Invoice> {
    const response = await testingRequest(this.input.app.getHttpServer())
      .get(`/invoices/${invoiceId}`)
      .set('Content-type', 'application/json')
      .expect(200);
    const invoice = plainToInstance(Invoice, response.body);
    expect(invoice.id).toBeDefined();
    return invoice;
  }

  async getOneDeleted(invoiceId: string): Promise<void> {
    await testingRequest(this.input.app.getHttpServer())
      .get(`/invoices/${invoiceId}`)
      .set('Content-type', 'application/json')
      .expect(404);
  }

  async getRisk(invoiceId: string): Promise<InvoiceRisk> {
    // We need to manually update the stats because the event publisher
    // does not publish events in the testing environment
    await this.updateRiskStats(invoiceId);
    const response = await testingRequest(this.input.app.getHttpServer())
      .get(`/invoices/${invoiceId}/risk`)
      .set('Content-type', 'application/json')
      .expect(200);
    return plainToInstance(InvoiceRisk, response.body);
  }

  private async updateRiskStats(invoiceId: string) {
    const invoice = await this.getOne(invoiceId);
    const databaseService = this.input.app.get(DatabaseService);
    const commandRunner = this.input.app.get(CommandRunner);
    await databaseService.withRequestContext(() =>
      this.doUpdateRiskStats(invoice, commandRunner),
    );
  }

  @Transactional()
  private async doUpdateRiskStats(
    invoice: Invoice,
    commandRunner: CommandRunner,
  ) {
    if (invoice.brokerId) {
      await commandRunner.run(
        new UpdateBrokerFactoringStatsCommand(invoice.brokerId),
      );
    }
  }
}
