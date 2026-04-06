import { CrossCuttingConcerns } from '@core/util';
import { CommandRunner, EventPublisher } from '@module-cqrs';
import { Transactional } from '@module-database';
import {
  InvoiceDocumentEntity,
  InvoiceEntity,
  RecordStatus,
} from '@module-persistence/entities';
import { InvoiceDocumentRepository } from '@module-persistence/repositories';
import { Injectable, Logger } from '@nestjs/common';
import { SendPurchaseEmailEvent, UpdateInvoiceDocumentRequest } from '../data';
import {
  FailInvoiceDocumentGenerationCommand,
  UpdateInvoiceDocumentCommand,
} from './commands';
import { EmailEvents } from '@common';

const OBSERVABILITY_TAG = 'invoice-document-service';

@Injectable()
export class InvoiceDocumentService {
  private logger: Logger = new Logger(InvoiceDocumentService.name);

  constructor(
    private repository: InvoiceDocumentRepository,
    private commandRunner: CommandRunner,
    private readonly eventPublisher: EventPublisher,
  ) {}

  @CrossCuttingConcerns({
    logging: (invoiceId: string, request: UpdateInvoiceDocumentRequest) => {
      return {
        message: `Update invoice document ${request.name} for invoice with id ${invoiceId}`,
      };
    },
    observability: {
      tag: [OBSERVABILITY_TAG, 'update-invoice-document'],
    },
  })
  async update(
    invoiceId: string,
    request: UpdateInvoiceDocumentRequest,
  ): Promise<InvoiceDocumentEntity> {
    const [invoice, invoiceDocument] = await this.doUpdate(invoiceId, request);
    if (request.options.sendDocumentAfterProcessingFlag) {
      this.eventPublisher.emit(
        EmailEvents.Purchase,
        new SendPurchaseEmailEvent(invoice.id),
      );
    }
    return invoiceDocument;
  }

  @Transactional('update-invoice-document')
  async doUpdate(
    invoiceId: string,
    request: UpdateInvoiceDocumentRequest,
  ): Promise<[InvoiceEntity, InvoiceDocumentEntity]> {
    return this.commandRunner.run(
      new UpdateInvoiceDocumentCommand(invoiceId, request),
    );
  }

  async failGeneration(invoiceId: string): Promise<InvoiceEntity> {
    return this.doFailGeneration(invoiceId);
  }

  @Transactional('fail-invoice-document-generation')
  private doFailGeneration(invoiceId: string) {
    return this.commandRunner.run(
      new FailInvoiceDocumentGenerationCommand(invoiceId),
    );
  }

  @Transactional('delete-invoice-document')
  async delete(id: string): Promise<boolean> {
    this.logger.log(`Deleting invoice document with id ${id}`);

    const document = await this.repository.getOneById(id);
    document.recordStatus = RecordStatus.Inactive;
    return true;
  }
}
