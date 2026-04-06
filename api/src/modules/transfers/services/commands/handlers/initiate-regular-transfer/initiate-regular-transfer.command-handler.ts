import { ChangeActions } from '@common';
import { Assignment, AssignmentResult, Note } from '@core/data';
import { formatBusinessTime, getCurrentUTCDate } from '@core/date-time';
import {
  payableAmount,
  penniesToDollars,
  transferableAmount,
} from '@core/formulas';
import { Arrays, CrossCuttingConcerns, formatToDollars } from '@core/util';
import { ValidationError } from '@core/validation';
import {
  ClientBankAccount,
  ClientBankAccountStatus,
  ProductName,
} from '@fs-bobtail/factoring/data';
import { Client, ClientService } from '@module-clients';
import { TransferTime, TransferTimeService } from '@module-common';
import { BasicCommandHandler } from '@module-cqrs';
import { InvoiceChangeActionsExecutor } from '@module-invoices-tag-activity';
import {
  ClientBatchPaymentEntity,
  ClientBatchPaymentStatus,
  ClientFactoringStatus,
  ClientPaymentEntity,
  ClientPaymentStatus,
  InvoiceClientPaymentEntity,
  InvoiceEntity,
  PaymentStatus,
  PaymentType,
  ReserveClientPaymentEntity,
  ReserveEntity,
  TagDefinitionKey,
} from '@module-persistence/entities';
import { Logger } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import Big from 'big.js';
import { TransfersApi } from '../../../../api';
import { TransferConfigurer } from '../../../transfer-configurer';
import {
  PaymentContext,
  TransferDataAccess,
  TransferDataMapper,
  TransferDestination,
  TransferEntitiesUtil as TransferEntities,
  TransferEntitiesUtil,
  TransferSentryMessage,
} from '../../common';
import { InitiateRegularTransferCommand } from '../../initiate-regular-transfer.command';

@CommandHandler(InitiateRegularTransferCommand)
export class InitiateRegularTransferCommandHandler
  implements BasicCommandHandler<InitiateRegularTransferCommand>
{
  private logger = new Logger(InitiateRegularTransferCommandHandler.name);

  constructor(
    private readonly clientService: ClientService,
    private readonly dataAccess: TransferDataAccess,
    private readonly invoiceChangeActionsExecutor: InvoiceChangeActionsExecutor,
    private readonly transfersAPI: TransfersApi,
    private readonly transferConfigurer: TransferConfigurer,
    private readonly transferTimeService: TransferTimeService,
  ) {}

  async execute(
    command: InitiateRegularTransferCommand,
  ): Promise<ClientBatchPaymentEntity> {
    // Step 1 - Validate no running transfer
    await this.validateNoRunningTransfer();

    // Step 2 - Create and persist entities. This ensures invoices are business locked (no updates) and no other transfer is initiated
    const { batchPayment, clientPaymentsMap, invoices } =
      await this.createAndPersistEntities(command);

    let transferInitiated = false;

    try {
      if (clientPaymentsMap.size === 0) {
        throw new ValidationError(
          'regular-transfer.no-invoices-or-release-of-funds',
          'No invoices or release of funds found for transfer',
        );
      }
      // Step 3 - Fetch transfer destinations
      const clientIds = Array.from(clientPaymentsMap.keys());
      const transferDestinations = await this.fetchTransferDestinations(
        clientIds,
      );

      // Step 4 - Categorize payments
      const { validPayments, invalidClientIds } = this.categorizePayments(
        clientPaymentsMap,
        transferDestinations,
      );

      if (validPayments.size === 0) {
        throw new ValidationError(
          'regular-transfer.no-valid-transfer-destinations',
          'No valid transfer destinations found for transfer',
        );
      }

      // Step 5 - Handle invalid and enrich valid payments
      if (invalidClientIds.length > 0) {
        this.handleInvalidPayments(
          invalidClientIds,
          clientPaymentsMap,
          invoices,
        );
      }

      const paymentsToUpdate = this.applyBankDetailsToPayments(validPayments);

      // Step 6 - Persist everything (batch payment changes + invoice status changes)
      await this.dataAccess.persistAndFlush([
        batchPayment,
        ...paymentsToUpdate,
        ...invoices,
      ]);

      // Step 7 - Initiate transfer
      await this.initiateTransfer(batchPayment, validPayments);
      transferInitiated = true;

      // Step 8 - Finalize and persist invoices
      await this.finalizeAndPersistInvoices(invoices, validPayments);
    } catch (error) {
      this.logger.error(
        `Critical failure in regular transfer flow. Reverting state.`,
        {
          batchPaymentId: batchPayment.id,
          error,
        },
      );
      if (!transferInitiated) {
        try {
          await this.revertTransferState(batchPayment, invoices);
        } catch (err) {
          this.logger.error(`Failed to revert transfer state`, {
            batchPaymentId: batchPayment.id,
            error: err,
          });
        }
        throw error;
      }
    }

    return batchPayment;
  }

  private async createAndPersistEntities(
    command: InitiateRegularTransferCommand,
  ): Promise<{
    batchPayment: ClientBatchPaymentEntity;
    clientPaymentsMap: Map<string, ClientPaymentEntity>;
    invoices: InvoiceEntity[];
  }> {
    const batchPayment = this.createBatchPayment(command);
    const { invoices, reserves } = await this.fetchTransferData();

    const clientPaymentsMap = this.createClientPayments(
      batchPayment,
      invoices,
      reserves,
    );

    invoices.forEach(
      (invoice) =>
        (invoice.clientPaymentStatus = ClientPaymentStatus.InProgress),
    );

    await this.dataAccess.persistAndFlush([batchPayment, ...invoices]);
    this.logger.debug(`Entities persisted for regular transfer`, {
      batchPaymentId: batchPayment.id,
      invoicesCount: invoices.length,
    });

    return { batchPayment, clientPaymentsMap, invoices };
  }

  private async initiateTransfer(
    batchPayment: ClientBatchPaymentEntity,
    validDestinations: Map<string, PaymentContext>,
  ): Promise<void> {
    const totalAmount = Array.from(validDestinations.values()).reduce(
      (sum, payment) => sum.add(payment.clientPayment.amount),
      Big(0),
    );

    this.logger.log(`Starting regular transfer`, {
      batchPaymentId: batchPayment.id,
      clientCount: validDestinations.size,
      totalAmount: formatToDollars(totalAmount),
    });

    await this.executeTransferRequest(batchPayment, validDestinations);

    this.logger.log(`Regular transfer initiated successfully`, {
      batchPaymentId: batchPayment.id,
    });
  }

  private async finalizeAndPersistInvoices(
    invoices: InvoiceEntity[],
    validDestinations: Map<string, PaymentContext>,
  ): Promise<void> {
    await this.finalizeInvoices(invoices, validDestinations);
    await this.dataAccess.persistAndFlush(invoices);
  }

  private async validateNoRunningTransfer(): Promise<void> {
    const isRunning = await this.dataAccess.isRegularBatchPaymentInProgress();
    if (isRunning) {
      throw new ValidationError(
        'regular-transfer.existing-running-transfer',
        'There is already an existing regular transfer running.',
      );
    }
  }

  private createBatchPayment(
    command: InitiateRegularTransferCommand,
  ): ClientBatchPaymentEntity {
    const batchPayment = TransferEntities.createBatchPayment(
      PaymentType.ACH,
      command.request.id,
    );
    batchPayment.status = ClientBatchPaymentStatus.InProgress;
    const currentDate = getCurrentUTCDate().toDate();
    batchPayment.expectedPaymentDate =
      this.transferTimeService.getRegularArrivalTime(currentDate);

    return batchPayment;
  }

  private async fetchTransferData(): Promise<{
    invoices: InvoiceEntity[];
    reserves: ReserveEntity[];
  }> {
    const currentDate = getCurrentUTCDate().toDate();
    const currentTransferWindow =
      this.transferTimeService.getCurrentTransferWindow(currentDate, 10);
    const shouldIncludeExpedited = this.shouldIncludeExpedited(
      currentTransferWindow,
    );
    this.logger.debug(`Should include expedited: ${shouldIncludeExpedited}`);

    const invoices = await this.dataAccess.getInvoicesForRegularTransfer(
      shouldIncludeExpedited,
    );
    const reserves = await this.dataAccess.getReleaseOfFunds();

    this.logger.debug(`Fetched data for regular transfer`, {
      invoices: invoices.length,
      reserves: reserves.length,
    });

    return { invoices, reserves };
  }

  private createClientPayments(
    batchPayment: ClientBatchPaymentEntity,
    invoices: InvoiceEntity[],
    reserves: ReserveEntity[],
  ): Map<string, ClientPaymentEntity> {
    const clientIds = Array.from(
      new Set([
        ...invoices.map((i) => i.clientId),
        ...reserves.map((r) => r.clientId),
      ]),
    );

    const clientPaymentsMap = new Map<string, ClientPaymentEntity>();

    for (const clientId of clientIds) {
      const clientInvoices = invoices.filter((i) => i.clientId === clientId);
      const clientReserves = reserves.filter((r) => r.clientId === clientId);

      if (clientInvoices.length === 0 && clientReserves.length === 0) continue;

      const invoicesTotalAmount = transferableAmount(clientInvoices);
      const reservesTotalAmount = clientReserves.reduce(
        (acc, r) => acc.add(r.amount.times(-1)),
        Big(0),
      );
      const totalAmount = invoicesTotalAmount.add(reservesTotalAmount);

      const clientPayment = TransferEntitiesUtil.createRegularClientPayment(
        totalAmount,
        clientId,
        batchPayment,
      );

      this.createInvoiceClientPayments(clientInvoices, clientPayment);
      this.createReserveClientPayments(clientReserves, clientPayment);

      clientPaymentsMap.set(clientId, clientPayment);
    }
    return clientPaymentsMap;
  }

  private async fetchTransferDestinations(
    clientIds: string[],
  ): Promise<Map<string, TransferDestination | null>> {
    const clientsAndBankAccounts = await this.getClientsAndPrimaryBankAccounts(
      clientIds,
    );

    const transferDestinations = new Map<string, TransferDestination | null>();

    for (const [clientId, data] of clientsAndBankAccounts) {
      const { client, primaryBankAccount } = data;
      const transferDestination = TransferDataMapper.asTransferDestination(
        client,
        primaryBankAccount,
      );
      if (!transferDestination) {
        this.logger.warn(
          `No valid transfer destination for client ${clientId}.`,
        );
      }
      transferDestinations.set(clientId, transferDestination);
    }
    return transferDestinations;
  }

  private applyBankDetailsToPayments(
    clientPaymentsMap: Map<string, PaymentContext>,
  ): ClientPaymentEntity[] {
    const clientPayments: ClientPaymentEntity[] = [];
    for (const [, paymentContext] of clientPaymentsMap) {
      const transferDestination = paymentContext.transferDestination;

      paymentContext.clientPayment.clientBankAccountId =
        transferDestination.internalBankAccountId;
      paymentContext.clientPayment.bankAccountLastDigits =
        transferDestination.account.slice(-4);
      clientPayments.push(paymentContext.clientPayment);
    }
    return clientPayments;
  }

  private handleInvalidPayments(
    invalidClientIds: string[],
    clientPaymentsMap: Map<string, ClientPaymentEntity>,
    invoices: InvoiceEntity[],
  ): void {
    invalidClientIds.forEach((clientId) => {
      const payment = clientPaymentsMap.get(clientId);
      if (payment) {
        // Remove from batch
        payment.batchPayment.clientPayments.remove(payment);
        if (payment.invoicePayments?.isInitialized()) {
          payment.invoicePayments.removeAll();
        }
        if (payment.reservePayments?.isInitialized()) {
          payment.reservePayments.removeAll();
        }
        clientPaymentsMap.delete(clientId);

        // Update invoices to Failed
        const clientInvoices = invoices.filter((i) => i.clientId === clientId);
        clientInvoices.forEach((invoice) => {
          invoice.clientPaymentStatus = ClientPaymentStatus.Failed;
        });

        this.logger.warn(
          `Removed client ${clientId} from batch and marked invoices as Failed due to missing bank details.`,
        );
      }
    });
  }

  private categorizePayments(
    clientPaymentsMap: Map<string, ClientPaymentEntity>,
    transferDestinations: Map<string, TransferDestination | null>,
  ): {
    validPayments: Map<string, PaymentContext>;
    invalidClientIds: string[];
  } {
    const validPayments = new Map<string, PaymentContext>();
    const invalidClientIds: string[] = [];

    for (const [clientId, clientPayment] of clientPaymentsMap) {
      const transferDestination = transferDestinations.get(clientId);
      if (transferDestination) {
        validPayments.set(clientId, {
          clientPayment,
          transferDestination,
        });
      } else {
        this.logger.warn(
          `Client ${clientId} does not have a valid transfer destination.`,
        );
        invalidClientIds.push(clientId);
      }
    }

    return { validPayments, invalidClientIds };
  }

  private async finalizeInvoices(
    invoices: InvoiceEntity[],
    validDestinations: Map<string, PaymentContext>,
  ): Promise<void> {
    const result: { invoice: InvoiceEntity; changeActions: ChangeActions }[] =
      [];

    // We iterate over invoices, find their client payment, find destination, add note.
    for (const [clientId, paymentContext] of validDestinations) {
      const clientInvoices = invoices.filter((i) => i.clientId === clientId);

      clientInvoices.forEach((invoice) => {
        const item = this.createInvoiceCompletionActions(
          invoice,
          paymentContext.clientPayment,
          paymentContext.transferDestination,
        );
        result.push(item);
      });
    }

    await Arrays.mapAsync(result, async ({ invoice, changeActions }) => {
      await this.invoiceChangeActionsExecutor.apply(invoice, changeActions);
    });
  }

  private createInvoiceCompletionActions(
    invoice: InvoiceEntity,
    clientPayment: ClientPaymentEntity,
    destination: TransferDestination,
  ): { invoice: InvoiceEntity; changeActions: ChangeActions } {
    let assignmentResult = AssignmentResult.empty();

    if (invoice.expedited) {
      assignmentResult = assignmentResult.concat(
        Assignment.assign(invoice, 'expedited', false),
      );
    }

    const changeActions = ChangeActions.addActivity(
      TagDefinitionKey.CLIENT_PAYMENT_UPDATE,
      Note.from({
        payload: assignmentResult.getPayload(),
        text: `Paid ${formatToDollars(
          penniesToDollars(payableAmount(invoice)),
        )} as part of ${formatToDollars(
          penniesToDollars(clientPayment.amount),
        )} batch, expected arrival ${formatBusinessTime(
          clientPayment.batchPayment.expectedPaymentDate,
        )} in account ${destination.account}`,
      }),
    );

    return { invoice, changeActions };
  }

  private async getClientsAndPrimaryBankAccounts(
    clientIds: string[],
  ): Promise<
    Map<string, { client: Client; primaryBankAccount: ClientBankAccount }>
  > {
    const fetchedClients = await this.clientService.findByIds(clientIds, {
      includeBankAccounts: true,
    });
    const clientsById = new Map(
      fetchedClients.map((client) => [client.id, client]),
    );

    const missingClientIds = clientIds.filter((id) => !clientsById.has(id));
    if (missingClientIds.length > 0) {
      this.logger.warn(`Clients not found in findByIds response`, {
        missingClientIds,
        totalRequested: clientIds.length,
        totalFound: fetchedClients.length,
      });
    }

    const activeClients = fetchedClients.filter((client) => {
      const isActive =
        client.factoringConfig.status === ClientFactoringStatus.Active;
      if (!isActive) {
        this.logger.warn(
          `Client ${client.id} is not active. Will be excluded from the transfer.`,
        );
      }
      return isActive;
    });

    const clients = new Map<
      string,
      { client: Client; primaryBankAccount: ClientBankAccount }
    >();

    for (const client of activeClients) {
      const primaryBankAccount = this.findPrimaryBankAccount(client);
      if (!primaryBankAccount) {
        this.logger.warn(
          `Client excluded from transfer: no primary bank account`,
          {
            clientId: client.id,
            totalBankAccounts: client.bankAccounts?.length ?? 0,
          },
        );
        continue;
      }
      clients.set(client.id, { client, primaryBankAccount });
    }

    if (clients.size === 0) {
      throw new ValidationError(
        'regular-transfer.no-valid-clients',
        'No valid clients found for transfer',
      );
    }

    return clients;
  }

  private findPrimaryBankAccount(client: Client): ClientBankAccount | null {
    const bankAccounts = client.bankAccounts ?? [];
    const activeBankAccounts = bankAccounts.filter(
      (ba) => ba.status === ClientBankAccountStatus.Active,
    );

    const bankAccount = activeBankAccounts.find((bankAccount) => {
      const products = bankAccount.products || [];
      const hasNonCardProducts = products.some(
        (product) => product.name !== ProductName.Card,
      );
      const hasNoProducts = products.length === 0;
      return hasNonCardProducts || hasNoProducts;
    });

    return bankAccount ?? null;
  }

  private shouldIncludeExpedited(
    transferTimeWindow: TransferTime | null,
  ): boolean {
    // include expedited only if we're inside the last transfer window of the day (second ach)
    if (transferTimeWindow === null) {
      return false;
    }
    return (
      this.transferTimeService.getLastTransferTimeOfTheDay().name ===
      transferTimeWindow.name
    );
  }

  private createReserveClientPayments(
    reserves: ReserveEntity[],
    clientPayment: ClientPaymentEntity,
  ): ReserveClientPaymentEntity[] {
    return reserves.map((reserve) =>
      TransferEntitiesUtil.createReserveClientPayment(reserve, clientPayment),
    );
  }

  private createInvoiceClientPayments(
    invoices: InvoiceEntity[],
    clientPayment: ClientPaymentEntity,
  ): InvoiceClientPaymentEntity[] {
    return invoices.map((invoice) =>
      TransferEntitiesUtil.createInvoiceClientPayment(invoice, clientPayment),
    );
  }

  @CrossCuttingConcerns({
    logging: (batchPayment: ClientBatchPaymentEntity) => {
      return {
        message: 'Initiating regular transfer',
        payload: {
          batchPaymentId: batchPayment.id,
        },
      };
    },
  })
  private async executeTransferRequest(
    batchPayment: ClientBatchPaymentEntity,
    clientPayments: Map<string, PaymentContext>,
  ): Promise<void> {
    const originatingAccountId =
      await this.transferConfigurer.internalAccountId();

    await this.transfersAPI.createAchBatch(
      batchPayment.id,
      TransferDataMapper.batchPaymentToACH(
        batchPayment.id,
        originatingAccountId,
        clientPayments,
        `${this.transferConfigurer.webHookUrl()}/transfers/update-status`,
      ),
    );

    await TransferSentryMessage.captureTransferSentryMessage(clientPayments);
  }

  private async revertTransferState(
    batchPayment: ClientBatchPaymentEntity,
    invoices: InvoiceEntity[],
  ): Promise<void> {
    batchPayment.status = ClientBatchPaymentStatus.Failed;

    if (batchPayment.clientPayments.isInitialized()) {
      batchPayment.clientPayments.getItems().forEach((cp) => {
        cp.status = PaymentStatus.FAILED;
      });
    }

    invoices.forEach((invoice) => {
      invoice.clientPaymentStatus = ClientPaymentStatus.Failed;
    });

    await this.dataAccess.persistAndFlush([batchPayment, ...invoices]);
  }
}
