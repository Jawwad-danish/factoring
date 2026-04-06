import { Invoice } from '@fs-bobtail/factoring/data';
import { DatabaseService, Transactional } from '@module-database';
import { InvoiceMapper } from '@module-invoices';
import {
  ClientPaymentStatus,
  InvoiceEntity,
} from '@module-persistence/entities';
import { InvoiceRepository } from '@module-persistence/repositories';
import { StepsInput } from '../step';

export class InvoicePaySteps {
  constructor(private readonly input: StepsInput) {}

  async sendPayment(id: string): Promise<Invoice> {
    const { app } = this.input;
    const databaseService = app.get(DatabaseService);
    const invoiceRepository = app.get(InvoiceRepository);
    const mapper = app.get(InvoiceMapper);
    const invoiceEntity = await databaseService.withRequestContext(() =>
      this.doPay(id, invoiceRepository, ClientPaymentStatus.Sent),
    );

    return mapper.entityToModel(invoiceEntity);
  }

  async completePayment(id: string): Promise<Invoice> {
    const { app } = this.input;
    const databaseService = app.get(DatabaseService);
    const invoiceRepository = app.get(InvoiceRepository);
    const mapper = app.get(InvoiceMapper);
    const invoiceEntity = await databaseService.withRequestContext(() =>
      this.doPay(id, invoiceRepository, ClientPaymentStatus.Completed),
    );

    return mapper.entityToModel(invoiceEntity);
  }

  @Transactional()
  private async doPay(
    id: string,
    invoiceRepository: InvoiceRepository,
    clientPaymentStatus: ClientPaymentStatus,
  ): Promise<InvoiceEntity> {
    const invoice = await invoiceRepository.getOneById(id);
    invoice.clientPaymentStatus = clientPaymentStatus;
    return invoice;
  }
}
