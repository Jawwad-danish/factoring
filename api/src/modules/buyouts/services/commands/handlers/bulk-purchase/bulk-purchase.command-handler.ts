import { EntityNotFoundError } from '@core/errors';
import { Arrays } from '@core/util';
import { CreateInvoiceRequest } from '@fs-bobtail/factoring/data';
import { Broker, BrokerService } from '@module-brokers';
import { InvoiceService } from '@module-invoices';
import { InvoiceContext } from '@module-invoices/data';
import {
  PendingBuyoutEntity,
  RecordStatus,
} from '@module-persistence/entities';
import { PendingBuyoutRepository } from '@module-persistence/repositories';
import { Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BulkPurchaseCommand } from '../../bulk-purchase.command';

@CommandHandler(BulkPurchaseCommand)
export class BulkPurchaseCommandHandler
  implements ICommandHandler<BulkPurchaseCommand, InvoiceContext[]>
{
  private readonly logger = new Logger(BulkPurchaseCommandHandler.name);

  constructor(
    private readonly buyoutsRepository: PendingBuyoutRepository,
    private readonly brokerService: BrokerService,
    private readonly invoiceService: InvoiceService,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async execute(_command: BulkPurchaseCommand): Promise<InvoiceContext[]> {
    const [pendingBuyouts] = await this.buyoutsRepository.findAll({
      recordStatus: RecordStatus.Active,
    });
    const createInvoiceRequests = await Arrays.mapAsync(
      pendingBuyouts,
      (buyout) => this.buyoutToCreateInvoiceRequest(buyout),
    );

    const promises = createInvoiceRequests.map((request) => {
      return this.invoiceService.create(request);
    });

    const results = await Promise.all(promises);

    pendingBuyouts.forEach((buyout) => {
      buyout.recordStatus = RecordStatus.Inactive;
    });
    return results;
  }

  private async buyoutToCreateInvoiceRequest(
    buyout: PendingBuyoutEntity,
  ): Promise<CreateInvoiceRequest> {
    let broker: Broker | null = null;
    if (buyout.brokerMC) {
      this.logger.log(`Finding broker by mc ${buyout.brokerMC}`);
      broker = await this.brokerService.findOneByMC(buyout.brokerMC);
    }

    if (!broker && buyout.brokerName) {
      this.logger.log(
        `Could not find broker by mc ${buyout.brokerMC}. Trying by name ${buyout.brokerName}`,
      );
      broker = await this.brokerService.findOneByName(buyout.brokerName);
    }

    if (!broker) {
      throw new EntityNotFoundError(
        `Could not find broker by mc ${buyout.brokerMC} or name ${buyout.brokerName}`,
      );
    }
    const request = new CreateInvoiceRequest();
    request.clientId = buyout.clientId;
    request.loadNumber = buyout.loadNumber;
    request.brokerId = broker?.id || null;
    request.displayId = buyout.loadNumber;
    request.expedited = false;
    request.lineHaulRate = buyout.rate;
    request.buyoutId = buyout.id;
    request.v1Payload = this.buildV1Payload(request, buyout, broker);
    request.ingestThrough = true;
    return request;
  }

  private buildV1Payload(
    request: CreateInvoiceRequest,
    buyout: PendingBuyoutEntity,
    broker: Broker | null,
  ): Record<string, any> {
    return {
      client_id: request.clientId,
      load_number: request.loadNumber,
      debtor_id: request.brokerId,
      debtor_selected_name: broker?.legalName || '',
      display_id: request.displayId,
      transfer_type: 'ach',
      primary_rate: request.lineHaulRate,
      invoice_documents: [],
      detention: '0',
      lumper: '0',
      original_buyout_invoice_date: buyout.paymentDate,
      is_buyout: true,
      buyout_id: request.buyoutId,
      status: 'pending',
    };
  }
}
