import { Invoice } from '@fs-bobtail/factoring/data';
import { BrokerService } from '@module-brokers';
import { ClientService } from '@module-clients';
import { BasicQueryHandler } from '@module-cqrs';
import {
  ClientBrokerAssignmentRepository,
  InvoiceRepository,
} from '@module-persistence/repositories';
import { QueryHandler } from '@nestjs/cqrs';
import { InvoiceMapper } from '../../../../data';
import { InvoiceDataAccess } from '../../../invoice-data-access';
import { FindInvoiceQuery } from '../../find-invoice.query';

@QueryHandler(FindInvoiceQuery)
export class FindInvoiceQueryHandler
  implements BasicQueryHandler<FindInvoiceQuery>
{
  constructor(
    private invoiceRepository: InvoiceRepository,
    private clientBrokerAssignmentRepository: ClientBrokerAssignmentRepository,
    private clientService: ClientService,
    private brokerService: BrokerService,
    private mapper: InvoiceMapper,
    private invoiceDataAccess: InvoiceDataAccess,
  ) {}

  async execute({ id }: FindInvoiceQuery): Promise<Invoice> {
    const invoiceEntity = await this.invoiceRepository.getOneById(id);
    const invoice = await this.mapper.entityToModel(invoiceEntity);
    const client = await this.clientService.getOneById(invoice.clientId, {
      includeHistory: true,
    });
    [client.dilutionRate, client.chargebacks] = await Promise.all([
      this.invoiceDataAccess.getDilutionRate(invoice.clientId),
      this.invoiceDataAccess.getClientRecentChargebacks(invoice.clientId),
    ]);
    invoice.client = client;
    if (invoice.brokerId) {
      const broker = await this.brokerService.findOneById(invoice.brokerId);
      if (broker !== null) {
        invoice.broker = broker;
      }
      const clientBrokerAssignment =
        await this.clientBrokerAssignmentRepository.findOne(
          invoice.clientId,
          invoice.brokerId,
        );
      if (clientBrokerAssignment) {
        invoice.clientBrokerAssignmentStatus = clientBrokerAssignment.status;
        invoice.clientBrokerAssignmentNoaSentDate =
          clientBrokerAssignment.createdAt;
      }
      const approvedLoads =
        await this.invoiceRepository.findLast3ApprovedInvoicesByBroker(
          invoice.brokerId,
        );
      if (approvedLoads && approvedLoads.length > 0) {
        invoice.approvedLoads = approvedLoads;
      }
    }
    return invoice;
  }
}
