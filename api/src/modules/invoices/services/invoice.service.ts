import { Injectable, Logger } from '@nestjs/common';

import {
  BrokerEvents,
  BrokerLimitEvent,
  ClientEvents,
  ClientLimitEvent,
  EmailEvents,
  InvoiceEvents,
} from '@common/events';
import { PageResult, PaginationResult, QueryCriteria } from '@core/data';
import { CauseAwareError } from '@core/errors';
import { Arrays, CrossCuttingConcerns } from '@core/util';
import { CreateInvoiceRequest, Invoice } from '@fs-bobtail/factoring/data';
import { Broker, BrokerService } from '@module-brokers';
import { Client, ClientService } from '@module-clients';
import { CommandRunner, EventPublisher, QueryRunner } from '@module-cqrs';
import { InvoiceRepository } from '@module-persistence/repositories';
import { InvoiceEntityUtil } from '@module-persistence/util';
import { instanceToPlain } from 'class-transformer';
import { Transactional } from '../../database';
import {
  AssignInvoiceActivityRequest,
  CompleteInvoiceKpiResponse,
  CreateInvoiceEvent,
  DeleteInvoiceActivityRequest,
  DeleteInvoiceRequest,
  InvoiceContext,
  InvoiceKpiResponse,
  InvoiceMapper,
  InvoicePrePurchaseCheck,
  InvoiceRejectedEvent,
  InvoiceRisk,
  InvoiceTaggedContext,
  InvoiceTaggedEvent,
  PurchaseInvoiceEvent,
  PurchaseInvoiceRequest,
  PurchaseVolume,
  RegenerateInvoiceDocumentRequest,
  RegenerateInvoiceEvent,
  RejectInvoiceRequest,
  RevertInvoiceRequest,
  SendPurchaseEmailEvent,
  ShareInvoiceRequest,
  UpdateInvoiceEvent,
  UpdateInvoiceRequest,
  VerifyInvoiceRequest,
} from '../data';
import {
  AssignInvoiceActivityCommand,
  CreateInvoiceCommand,
  DeleteInvoiceActivityCommand,
  DeleteInvoiceCommand,
  PurchaseInvoiceCommand,
  RegenerateInvoiceDocumentCommand,
  RejectInvoiceCommand,
  RevertInvoiceCommand,
  ShareInvoiceCommand,
  UpdateInvoiceCommand,
  VerifyInvoiceCommand,
} from './commands';
import { DocumentsProcessor } from './documents-processing.service';
import { DuplicateDetectionItem } from './engines';
import {
  CheckPossibleDuplicatesError,
  CreateInvoiceError,
  DeleteTagInvoiceError as DeleteInvoiceActivityError,
  DeleteInvoiceError,
  PrePurchaseCheckError,
  PurchaseInvoiceError,
  RegenerateDocsError,
  RejectInvoiceError,
  RevertInvoiceError,
  UpdateInvoiceError,
} from './errors';
import { AssignInvoiceActivityError } from './errors/assign-tag-invoice.error';
import { VerifyInvoiceError } from './errors/verify-invoice.error';
import {
  CheckPossibleDuplicateQuery,
  FindInvoiceQuery,
  FindInvoiceRiskQuery,
  FindInvoicesQuery,
  GetPurchaseVolumeQuery,
  InvoicePrePurchaseCheckQuery,
} from './queries';

@Injectable()
export class InvoiceService {
  logger: Logger = new Logger(InvoiceService.name);

  constructor(
    private invoiceRepository: InvoiceRepository,
    private mapper: InvoiceMapper,
    private clientService: ClientService,
    private brokerService: BrokerService,
    private queryRunner: QueryRunner,
    private commandRunner: CommandRunner,
    private documentProcessor: DocumentsProcessor,
    private readonly eventPublisher: EventPublisher,
  ) {}

  @CrossCuttingConcerns({
    error: {
      errorSupplier: (cause) => new CreateInvoiceError(cause),
    },
    logging: (request: CreateInvoiceRequest) => {
      return {
        message: 'Create invoice',
        payload: {
          brokerId: request.brokerId,
          clientId: request.clientId,
          id: request.id,
          loadNumber: request.loadNumber,
        },
      };
    },
  })
  async create(request: CreateInvoiceRequest): Promise<InvoiceContext> {
    const context = await this.doCreate(request);
    this.eventPublisher.emit(
      InvoiceEvents.CreateInvoice,
      new CreateInvoiceEvent({
        client: context.client,
        invoice: context.entity,
      }),
    );

    await this.documentProcessor.sendToProcess(context);
    return context;
  }

  @Transactional('invoice-create')
  private async doCreate(
    request: CreateInvoiceRequest,
  ): Promise<InvoiceContext> {
    return this.commandRunner.run(new CreateInvoiceCommand(request));
  }

  @CrossCuttingConcerns({
    error: {
      errorSupplier: (cause, id: string) => new UpdateInvoiceError(id, cause),
    },
    logging: (id: string) => {
      return {
        message: 'Update invoice',
        payload: {
          id,
        },
      };
    },
  })
  async update(
    id: string,
    request: UpdateInvoiceRequest,
  ): Promise<InvoiceContext> {
    const oldInvoice = await this.invoiceRepository.getOneById(id);
    const oldBrokerId = oldInvoice.brokerId;

    const context = await this.doUpdate(id, request);
    this.eventPublisher.emit(
      'invoice.update',
      new UpdateInvoiceEvent({
        invoiceId: context.entity.id,
      }),
    );

    const newBrokerId = context.entity.brokerId;
    if (oldBrokerId !== newBrokerId) {
      if (oldBrokerId) {
        this.eventPublisher.emit(
          BrokerEvents.Limit,
          new BrokerLimitEvent(oldBrokerId),
        );
      }
      if (newBrokerId) {
        this.eventPublisher.emit(
          BrokerEvents.Limit,
          new BrokerLimitEvent(newBrokerId),
        );
      }
    }

    return context;
  }

  @Transactional('invoice-update')
  doUpdate(id: string, request: UpdateInvoiceRequest): Promise<InvoiceContext> {
    return this.commandRunner.run(new UpdateInvoiceCommand(id, request));
  }

  @CrossCuttingConcerns({
    error: {
      errorSupplier: (cause, id: string) => new PurchaseInvoiceError(id, cause),
    },
    logging: (id: string) => {
      return {
        message: 'Purchase invoice',
        payload: {
          id,
        },
      };
    },
  })
  async purchase(
    id: string,
    request: PurchaseInvoiceRequest,
  ): Promise<InvoiceContext> {
    const context = await this.doPurchase(id, request);
    this.eventPublisher.emit(
      InvoiceEvents.PurchaseInvoice,
      new PurchaseInvoiceEvent({
        client: context.client,
        brokerId: context.entity.brokerId as string,
        purchasedAt: context.entity.purchasedDate!,
      }),
    );

    this.eventPublisher.emit(
      ClientEvents.Limit,
      new ClientLimitEvent(context.client.id),
    );

    if (context.entity.brokerId) {
      this.eventPublisher.emit(
        BrokerEvents.Limit,
        new BrokerLimitEvent(context.entity.brokerId),
      );
      this.eventPublisher.emit(
        EmailEvents.Purchase,
        new SendPurchaseEmailEvent(context.entity.id),
      );
    }
    return context;
  }

  @Transactional('invoice-purchase')
  private async doPurchase(
    id: string,
    request: PurchaseInvoiceRequest,
  ): Promise<InvoiceContext> {
    return this.commandRunner.run(new PurchaseInvoiceCommand(id, request));
  }

  @CrossCuttingConcerns({
    error: {
      errorSupplier: (cause, id: string) => new RevertInvoiceError(id, cause),
    },
    logging: (id: string) => {
      return {
        message: 'Revert invoice',
        payload: {
          id,
        },
      };
    },
  })
  @Transactional('invoice-revert')
  revert(id: string, payload: RevertInvoiceRequest): Promise<InvoiceContext> {
    return this.commandRunner.run(new RevertInvoiceCommand(id, payload));
  }

  @CrossCuttingConcerns({
    error: {
      errorSupplier: (cause, id: string) => new RejectInvoiceError(id, cause),
    },
    logging: (id: string) => {
      return {
        message: 'Reject invoice',
        payload: {
          id,
        },
      };
    },
  })
  async reject(
    id: string,
    payload: RejectInvoiceRequest,
  ): Promise<InvoiceContext> {
    const result = await this.doReject(id, payload);
    this.eventPublisher.emit(
      InvoiceEvents.InvoiceRejected,
      new InvoiceRejectedEvent({
        request: payload,
        invoiceId: result.entity.id,
      }),
    );
    return result;
  }

  @Transactional('invoice-reject')
  async doReject(
    id: string,
    payload: RejectInvoiceRequest,
  ): Promise<InvoiceContext> {
    return this.commandRunner.run(new RejectInvoiceCommand(id, payload));
  }

  @CrossCuttingConcerns<InvoiceService, 'verify'>({
    error: {
      errorSupplier: (cause, id: string) => new VerifyInvoiceError(id, cause),
    },
    logging: (id: string, { status }: VerifyInvoiceRequest) => {
      return {
        message: 'Verify invoice',
        payload: {
          id,
          status,
        },
      };
    },
  })
  @Transactional('invoice-verify')
  verify(id: string, payload: VerifyInvoiceRequest): Promise<InvoiceContext> {
    return this.commandRunner.run(new VerifyInvoiceCommand(id, payload));
  }

  @CrossCuttingConcerns({
    error: {
      errorSupplier: (cause) => new CheckPossibleDuplicatesError(cause),
    },
    logging: (request: CreateInvoiceRequest) => {
      return {
        message: 'Check invoice possible duplicates',
        payload: {
          brokerId: request.brokerId,
          clientId: request.clientId,
          id: request.id,
          loadNumber: request.loadNumber,
        },
      };
    },
  })
  @Transactional('invoice-possible-duplicate-check')
  possibleDuplicateCheck(
    request: CreateInvoiceRequest,
  ): Promise<DuplicateDetectionItem[]> {
    return this.queryRunner.run(new CheckPossibleDuplicateQuery(request));
  }

  @CrossCuttingConcerns({
    error: {
      errorSupplier: (cause, id: string) => new DeleteInvoiceError(id, cause),
    },
    logging: (id: string) => {
      return {
        message: 'Delete invoice',
        payload: {
          id,
        },
      };
    },
  })
  @Transactional('invoice-delete')
  async delete(id: string, payload: DeleteInvoiceRequest): Promise<void> {
    return this.commandRunner.run(new DeleteInvoiceCommand(id, payload));
  }

  @CrossCuttingConcerns({
    error: {
      errorSupplier: (cause, id: string) => new RegenerateDocsError(id, cause),
    },
    logging: (id: string) => {
      return {
        message: 'Regenerate invoice PDF',
        payload: {
          id,
        },
      };
    },
  })
  async regenerateDocs(
    id: string,
    payload: RegenerateInvoiceDocumentRequest,
  ): Promise<void> {
    await this.doRegenerateDocs(id, payload);
    this.eventPublisher.emit(
      'invoice.regenerate',
      new RegenerateInvoiceEvent({
        invoiceId: id,
      }),
    );
  }

  @Transactional('regenerate-invoice-docs')
  private async doRegenerateDocs(
    id: string,
    payload: RegenerateInvoiceDocumentRequest,
  ) {
    await this.commandRunner.run(
      new RegenerateInvoiceDocumentCommand(id, payload),
    );
  }

  @Transactional()
  async getRisk(id: string): Promise<InvoiceRisk> {
    return await this.queryRunner.run(new FindInvoiceRiskQuery(id));
  }

  async getOneById(id: string): Promise<Invoice> {
    return await this.queryRunner.run(new FindInvoiceQuery(id));
  }

  private async getClientsForInvoices(
    invoices: Invoice[],
  ): Promise<Map<string, Client>> {
    const map = new Map<string, Client>();
    const clientIds = Array.from(new Set(invoices.map((i) => i.clientId)));
    const clients = await this.clientService.findByIds(clientIds);
    for (const client of clients) {
      map.set(client.id, client);
    }
    return map;
  }

  private async getBrokersForInvoices(
    invoices: Invoice[],
  ): Promise<Map<string, Broker>> {
    const map = new Map<string, Broker>();
    const ids = Array.from(
      new Set(
        invoices
          .filter((i) => i.brokerId != null)
          .map((i) => i.brokerId as string),
      ),
    );
    const brokers = await this.brokerService.findByIds(ids);
    for (const broker of brokers) {
      map.set(broker.id, broker);
    }
    return map;
  }

  @CrossCuttingConcerns({
    logging: (criteria: QueryCriteria) => {
      return {
        message: 'Fetching invoices with query criteria',
        payload: criteria,
      };
    },
  })
  async findAll(criteria: QueryCriteria): Promise<PageResult<Invoice>> {
    const { invoiceEntities, count, totalAmount } = await this.queryRunner.run(
      new FindInvoicesQuery(criteria),
    );
    const additionalAttributes = {
      totalAmount,
      clientTotalGrouppedById: {},
      brokerTotalGrouppedById: {},
    };
    const invoices = await Arrays.mapAsync(invoiceEntities, async (entity) => {
      if (entity.clientUnderReviewTotal) {
        additionalAttributes.clientTotalGrouppedById[entity.clientId] =
          entity.clientUnderReviewTotal;
      }
      if (entity.brokerUnderReviewTotal) {
        additionalAttributes.brokerTotalGrouppedById[entity.brokerId || ''] =
          entity.brokerUnderReviewTotal;
      }
      return await this.mapper.entityToModel(entity);
    });

    if (invoices.length) {
      const clients = await this.getClientsForInvoices(invoices);
      const brokers = await this.getBrokersForInvoices(invoices);
      for (const invoice of invoices) {
        invoice.client = clients.get(invoice.clientId);
        if (invoice.brokerId)
          invoice.broker = brokers.get(invoice.brokerId) || null;
      }
    }

    return new PageResult(
      invoices,
      new PaginationResult(criteria.page.page, criteria.page.limit, count),
      additionalAttributes,
    );
  }

  @CrossCuttingConcerns({
    error: {
      errorSupplier: (cause, invoiceId: string) =>
        new PrePurchaseCheckError(invoiceId, cause),
    },
    logging: (invoiceId: string) => {
      return {
        message: 'Check if invoice can be purchased',
        payload: {
          id: invoiceId,
        },
      };
    },
  })
  async checkInvoiceForPurchase(
    invoiceId: string,
    request: PurchaseInvoiceRequest,
  ): Promise<InvoicePrePurchaseCheck> {
    return this.queryRunner.run(
      new InvoicePrePurchaseCheckQuery(invoiceId, request),
    );
  }

  @CrossCuttingConcerns({
    error: {
      errorSupplier: (
        cause,
        id: string,
        request: AssignInvoiceActivityRequest,
      ) => new AssignInvoiceActivityError(id, cause, request),
    },
    logging: (id: string) => {
      return {
        message: 'Assign activity to invoice',
        payload: {
          id,
        },
      };
    },
  })
  @Transactional('invoice-assign-activity')
  async doAssignInvoiceActivity(
    invoiceId: string,
    request: AssignInvoiceActivityRequest,
  ): Promise<InvoiceTaggedContext> {
    return await this.commandRunner.run(
      new AssignInvoiceActivityCommand(invoiceId, request),
    );
  }

  async assignInvoiceActivity(
    invoiceId: string,
    request: AssignInvoiceActivityRequest,
  ) {
    const result = await this.doAssignInvoiceActivity(invoiceId, request);
    const wasInvoiceTagged = await InvoiceEntityUtil.isTagged(
      result.invoice,
      request.key,
    );
    if (wasInvoiceTagged) {
      this.eventPublisher.emit(
        InvoiceEvents.InvoiceTagged,
        new InvoiceTaggedEvent({
          invoiceId: result.invoice.id,
          request,
        }),
      );
    }
    return await this.getOneById(invoiceId);
  }

  @CrossCuttingConcerns({
    error: {
      errorSupplier: (cause, id: string) =>
        new DeleteInvoiceActivityError(id, cause),
    },
    logging: (id: string) => {
      return {
        message: 'Delete activity from invoice',
        payload: {
          id,
        },
      };
    },
  })
  @Transactional('invoice-delete-activity')
  async deleteActivity(
    invoiceId: string,
    activityId: string,
    request: DeleteInvoiceActivityRequest,
  ): Promise<void> {
    return await this.commandRunner.run(
      new DeleteInvoiceActivityCommand(invoiceId, activityId, request),
    );
  }

  async getProcessingInvoicesKpis(id: string): Promise<InvoiceKpiResponse> {
    const [purchased, underReview, invoicesWithIssues] = await Promise.all([
      this.invoiceRepository.getTotalPurchasedInvoicesByClientId(id),
      this.invoiceRepository.getTotalUnderReviewInvoicesByClientId(id),
      this.invoiceRepository.getTotalInvoicesWithIssuesByClientId(id),
    ]);

    const response = new InvoiceKpiResponse(
      purchased,
      underReview,
      invoicesWithIssues,
    );

    return instanceToPlain(response) as InvoiceKpiResponse;
  }

  async getCompletedInvoiceKpisByClientId(
    clientId: string,
  ): Promise<CompleteInvoiceKpiResponse> {
    const kpis = await this.invoiceRepository.getCompletedInvoiceKpisByClientId(
      clientId,
    );

    return new CompleteInvoiceKpiResponse(
      kpis.accountsReceivable0to30,
      kpis.accountsReceivable30to60,
      kpis.accountsReceivableOver60,
      kpis.accountsReceivableTotal,
    );
  }

  @Transactional('invoice-share')
  async share(id: string, request: ShareInvoiceRequest): Promise<void> {
    await this.commandRunner.run(new ShareInvoiceCommand(id, request));
  }

  @CrossCuttingConcerns<InvoiceService, 'getPurchaseVolume'>({
    logging: () => ({
      message: 'Getting purchase volume',
    }),
    error: {
      errorSupplier: (cause) =>
        new CauseAwareError(
          'purchase-volume',
          'Failed to get purchase volume',
          cause,
        ),
    },
  })
  getPurchaseVolume(): Promise<PurchaseVolume> {
    return this.queryRunner.run(new GetPurchaseVolumeQuery());
  }
}
